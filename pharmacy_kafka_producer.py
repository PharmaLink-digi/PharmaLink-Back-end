import os
import sys
import json
import time
import random
import logging
import argparse
import threading
from datetime import datetime, timedelta
import uuid
import pandas as pd
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable

# ─────────────────────────────────────────────
# لو بتشغّل من برا Docker (WSL أو host):
KAFKA_SERVERS = ["localhost:29092","localhost:29093","localhost:29094"]
# لو بتشغّل من جوا container في نفس الـ network:
# KAFKA_SERVERS = ["kafka:9092","kafka2:9093","kafka3:9094"]
# ─────────────────────────────────────────────

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
EXPIRY_THRESHOLD_DAYS = 30


TOPICS = {
    "pharmacy.sales":              {"partitions": 10, "key_field": "pharm_id",     "csv": "SALES.csv"},
    "pharmacy.orders":             {"partitions": 10, "key_field": "pharm_id",     "csv": "T_ORDERS.csv"},
    "pharmacy.inventory.updates":  {"partitions": 10, "key_field": "pharm_id",     "csv": "T_PHARM_INVENTORY.csv"},
    "pharmacy.expiry.alerts":      {"partitions": 5,  "key_field": "medication_id","csv": "T_PHARM_INVENTORY.csv"},
    "pharmacy.exchange":           {"partitions": 5,  "key_field": "medication_id","csv": "T_EXCHANGE_PHARM.csv"},
    "warehouse.inventory.updates": {"partitions": 10, "key_field": "warehouse_id", "csv": "T_WAREHOUSE_INVENTORY.csv"},
    "pharmacy.order.details":      {"partitions": 10, "key_field": "order_id",     "csv": "T_ORDER_DETAILS.csv"},
    "pharmacy.dlq":                {"partitions": 5,  "key_field": "error",        "csv": None},
}


# ────────────────────────────────────────────────────────────────────
def get_logger(name: str) -> logging.Logger:
    log = logging.getLogger(name)
    if not log.handlers:
        h = logging.StreamHandler()
        h.setFormatter(logging.Formatter(
            "%(asctime)s | %(levelname)-7s | %(name)-30s | %(message)s",
            datefmt="%H:%M:%S",
        ))
        log.addHandler(h)
        log.setLevel(logging.INFO)
    return log


def _val_ser(data: dict) -> bytes:
    return json.dumps(data, ensure_ascii=False, default=str).encode("utf-8")


def _key_ser(key) -> bytes:
    return str(key).encode("utf-8") if key is not None else None


# ────────────────────────────────────────────────────────────────────
# Base Producer
# ────────────────────────────────────────────────────────────────────
class BaseProducer:

    def __init__(self, name: str, topic: str, delay: float = 0.001):
        self.name      = name
        self.topic     = topic
        self.delay     = delay
        self.log       = get_logger(name)
        self.sent      = 0
        self.failed    = 0
        self._sim      = False
        self._producer = self._connect()

    def _connect(self):
        for attempt in range(1, 4):
            try:
                p = KafkaProducer(
                    bootstrap_servers=KAFKA_SERVERS,
                    value_serializer=_val_ser,
                    key_serializer=_key_ser,
                    acks="all",
                    retries=5,
                    linger_ms=20,
                    compression_type="gzip",
                )
                self.log.info(f"Connected to Kafka @ {KAFKA_SERVERS}")
                return p
            except NoBrokersAvailable:
                self.log.warning(f"Attempt {attempt}/3 — broker not ready, retrying...")
                time.sleep(3)

        self.log.warning("SIMULATION MODE — no broker found")
        self._sim = True
        return None

    # ── FIX 1: إزلنا Sself وصححنا الـ DLQ ──────────────────────────
    def send(self, key, event_type: str, payload: dict):
        msg = {
            "event_id":   str(uuid.uuid4()),
            "event_type": event_type,
            "producer":   self.name,
            "ts":         datetime.now().isoformat(),   # FIX: isoformat مش datetime object
            "payload":    payload,
        }

        if self._sim:
            self.log.info(f"[SIM] {self.topic} | key={key} | {event_type}")
            self.sent += 1
            return

        try:
            self._producer.send(self.topic, key=key, value=msg)
            self.sent += 1                              # FIX: Sself → self

        except Exception as e:
            self.failed += 1
            self.log.error(f"Send failed: {e}")
            # ── DLQ ─────────────────────────────────────────────────
            try:
                dlq_msg = {
                    "error":          str(e),
                    "original_topic": self.topic,
                    "key":            str(key),
                    "payload":        msg,
                    "ts":             datetime.utcnow().isoformat(),
                }
                self._producer.send("pharmacy.dlq", key=str(key), value=dlq_msg)  # FIX: كنا بنتشيك على الـ method بدل ما نكالها
            except Exception as dlq_err:
                self.log.error(f"DLQ also failed: {dlq_err}")

    def close(self):
        if self._producer:
            self._producer.flush()
            self._producer.close()
        self.log.info(f"Done — sent={self.sent} | failed={self.failed}")

    def __enter__(self):  return self
    def __exit__(self, *_): self.close()

    def sleep(self):
        time.sleep(max(0, self.delay + random.uniform(-0.001, 0.001)))


# ────────────────────────────────────────────────────────────────────
# Sales Producer  —  topic: pharmacy.sales
# ────────────────────────────────────────────────────────────────────
class SalesProducer(BaseProducer):

    def __init__(self, delay=0.1):
        super().__init__("SalesProducer", "pharmacy.sales", delay)

    def produce(self, loop=False):
        df = pd.read_csv(
            os.path.join(DATA_DIR, "SALES.csv"),
            encoding="utf-8",
            parse_dates=["date_out"],          # FIX: parse_dates هنا
        )
        self.log.info(f"{len(df):,} sales rows loaded")

        while True:
            for r in df.itertuples(index=False):
                self.send(
                    key=str(r.pharm_id),
                    event_type="SALE_COMPLETED",
                    payload={
                        "sale_id":          int(r.sale_id),
                        "order_id":         int(r.order_id),
                        "client_id":        int(r.client_id),
                        "pharm_id":         int(r.pharm_id),
                        "inventory_id":     int(r.inventory_id),
                        "warehouse_id":     int(r.warehouse_id),
                        "pharm_name":       str(r.pharm_name),
                        "medication_id":    int(r.medication_id),
                        "medication_name":  str(r.medication_name),
                        "quantity_ordered": int(r.quantity_ordered),
                        "price_per_unit":   float(r.price_per_unit),
                        "total_sales":      float(r.total_sales),
                        "date_out":         r.date_out.isoformat() if pd.notnull(r.date_out) else None,
                    },
                )
                self.sleep()
            if not loop:
                break


# ────────────────────────────────────────────────────────────────────
# Orders Producer  —  topic: pharmacy.orders
# ────────────────────────────────────────────────────────────────────
class OrdersProducer(BaseProducer):

    STATUS_EVENT = {
        "Completed": "ORDER_COMPLETED",
        "Pending":   "ORDER_PENDING",
        "Cancelled": "ORDER_CANCELLED",
    }

    def __init__(self, delay=0.1):
        super().__init__("OrdersProducer", "pharmacy.orders", delay)

    def produce(self, loop=False):
        df = pd.read_csv(
            os.path.join(DATA_DIR, "T_ORDERS.csv"),
            encoding_errors="replace",
            parse_dates=["order_date"],
        )
        self.log.info(f"{len(df):,} orders loaded")

        while True:
            for r in df.itertuples(index=False):
                status = str(r.status)
                self.send(
                    key=str(r.pharm_id),
                    event_type=self.STATUS_EVENT.get(status, "ORDER_UPDATED"),
                    payload={
                        "order_id":   int(r.order_id),
                        "client_id":  int(r.client_id),
                        "pharm_id":   int(r.pharm_id),
                        "pharm_name": str(r.pharm_name),
                        "order_date": r.order_date.isoformat() if pd.notnull(r.order_date) else None,
                        "status":     status,
                    },
                )
                self.sleep()
            if not loop:
                break


# ────────────────────────────────────────────────────────────────────
# Order Details Producer  —  topic: pharmacy.order.details
# ────────────────────────────────────────────────────────────────────
class OrderDetailsProducer(BaseProducer):

    def __init__(self, delay=0.1):
        super().__init__("OrderDetailsProducer", "pharmacy.order.details", delay)

    def produce(self, loop=False):
        df = pd.read_csv(
            os.path.join(DATA_DIR, "T_ORDER_DETAILS.csv"),
            encoding_errors="replace",
            parse_dates=["order_date"],
        )
        self.log.info(f"{len(df):,} order-details rows loaded")

        while True:
            for r in df.itertuples(index=False):
                self.send(
                    key=str(r.pharm_id),
                    event_type="ORDER_DETAIL_CREATED",
                    payload={
                        "order_detail_id": int(r.order_detail_id),
                        "order_id":        int(r.order_id),
                        "sale_id":         int(r.sale_id),
                        "client_id":       int(r.client_id),
                        "pharm_id":        int(r.pharm_id),
                        "pharm_name":      str(r.pharm_name),
                        "warehouse_id":    int(r.warehouse_id),
                        "warehouse_code":  str(r.warehouse_code),
                        "inventory_id":    int(r.inventory_id),
                        "medication_id":   int(r.medication_id),
                        "medication_name": str(r.medication_name),
                        "medication_type": str(r.medication_type),
                        "category":        str(r.category),
                        "quantity":        int(r.quantity),
                        "unit_price":      float(r.unit_price),
                        "line_total":      float(r.line_total),
                        "order_date":      r.order_date.isoformat() if pd.notnull(r.order_date) else None,
                    },
                )
                self.sleep()
            if not loop:
                break


# ────────────────────────────────────────────────────────────────────
# Pharmacy Inventory Producer  —  topic: pharmacy.inventory.updates
# ────────────────────────────────────────────────────────────────────
class PharmInventoryProducer(BaseProducer):

    def __init__(self, delay=0.1):
        super().__init__("PharmInventoryProducer", "pharmacy.inventory.updates", delay)

    def produce(self, loop=False):
        df = pd.read_csv(
            os.path.join(DATA_DIR, "T_PHARM_INVENTORY.csv"),
            encoding_errors="replace",
            parse_dates=["date_in", "date_expiry"],    # FIX: parse_dates ناقص كان
        )
        self.log.info(f"{len(df):,} inventory rows loaded")

        while True:
            for r in df.itertuples(index=False):
                qty   = int(r.quantity)
                avail = str(r.availability)
                event = "INVENTORY_OUT_OF_STOCK" if avail == "Out of Stock" else "INVENTORY_UPDATED"

                self.send(
                    key=str(r.pharm_id),
                    event_type=event,
                    payload={
                        "inventory_id":    int(r.inventory_id),
                        "pharm_id":        int(r.pharm_id),
                        "pharm_name":      str(r.pharm_name),
                        "warehouse_id":    int(r.warehouse_id),
                        "warehouse_code":  str(r.warehouse_code),
                        "medication_id":   int(r.medication_id),
                        "medication_name": str(r.medication_name),
                        "medication_type": str(r.medication_type),
                        "category":        str(r.category),
                        "warehouse_price": float(r.warehouse_price),
                        "price_sell":      float(r.price_sell),
                        "movement_type":   str(r.movement_type),
                        "quantity":        qty,
                        "availability":    avail,
                        "date_in":         r.date_in.isoformat()     if pd.notnull(r.date_in)     else None,
                        "date_expiry":     r.date_expiry.isoformat() if pd.notnull(r.date_expiry) else None,
                    },
                )
                self.sleep()
            if not loop:
                break


# ────────────────────────────────────────────────────────────────────
# Expiry Alert Producer  —  topic: pharmacy.expiry.alerts
# ────────────────────────────────────────────────────────────────────
class ExpiryAlertProducer(BaseProducer):

    def __init__(self, delay=0.1):
        super().__init__("ExpiryAlertProducer", "pharmacy.expiry.alerts", delay)

    def produce(self, loop=False):
        df = pd.read_csv(
            os.path.join(DATA_DIR, "T_PHARM_INVENTORY.csv"),
            encoding_errors="replace",
            parse_dates=["date_expiry"],
        )
        today    = datetime.now()
        deadline = today + timedelta(days=EXPIRY_THRESHOLD_DAYS)
        alerts   = df[df["date_expiry"] <= deadline].copy()
        alerts["days_left"] = (alerts["date_expiry"] - today).dt.days
        self.log.info(f"{len(alerts):,} expiry-alert rows (from {len(df):,} total)")

        while True:
            for r in alerts.itertuples(index=False):
                self.send(
                    key=f"{r.pharm_id}:{r.medication_id}",
                    event_type="PHARMACY_EXPIRY_ALERT",
                    payload={
                        "inventory_id":    int(r.inventory_id),
                        "pharm_id":        int(r.pharm_id),
                        "pharm_name":      str(r.pharm_name),
                        "warehouse_id":    int(r.warehouse_id),
                        "warehouse_code":  str(r.warehouse_code),
                        "medication_id":   int(r.medication_id),
                        "medication_name": str(r.medication_name),
                        "medication_type": str(r.medication_type),
                        "category":        str(r.category),
                        "quantity":        int(r.quantity),
                        "movement_type":   str(r.movement_type),
                        "availability":    str(r.availability),
                        "date_expiry":     r.date_expiry.isoformat() if pd.notnull(r.date_expiry) else None,
                        "days_left":       int(r.days_left),
                        "event_ts":        today.isoformat(),
                    },
                )
                self.sleep()
            if not loop:
                break


# ────────────────────────────────────────────────────────────────────
# Exchange Producer  —  topic: pharmacy.exchange
# ────────────────────────────────────────────────────────────────────
class ExchangeProducer(BaseProducer):

    STATUS_EVENT = {
        "Pending":   "EXCHANGE_REQUESTED",
        "Approved":  "EXCHANGE_APPROVED",
        "Completed": "EXCHANGE_COMPLETED",
        "Rejected":  "EXCHANGE_REJECTED",
    }

    def __init__(self, delay=0.1):
        super().__init__("ExchangeProducer", "pharmacy.exchange", delay)

    def produce(self, loop=False):
        csv_path = os.path.join(DATA_DIR, "T_EXCHANGE_PHARM.csv")
        self.log.info(f"Exchange CSV: {csv_path}")

        while True:
            for chunk in pd.read_csv(
                csv_path,
                chunksize=1000,
                encoding_errors="replace",
                parse_dates=["request_date"],          # FIX: parse_dates
            ):
                for r in chunk.itertuples(index=False):
                    status = str(r.status)
                    self.send(
                        key=f"{r.from_pharm_id}:{r.to_pharm_id}",
                        event_type=self.STATUS_EVENT.get(status, "EXCHANGE_UPDATED"),
                        payload={
                            "request_id":          int(r.request_id),
                            "from_pharm_id":        int(r.from_pharm_id),
                            "from_pharm_name":      str(r.from_pharm_name),
                            "to_pharm_id":          int(r.to_pharm_id),
                            "to_pharm_name":        str(r.to_pharm_name),
                            "inventory_id":         int(r.inventory_id),
                            "warehouse_id":         int(r.warehouse_id),
                            "medication_id":        int(r.medication_id),
                            "medication_name":      str(r.medication_name),
                            "quantity_requested":   int(r.quantity_requested),
                            "price_sell":           float(r.price_sell),
                            "discount_percent":     float(r.discount_percent),
                            "price_after_discount": float(r.price_after_discount),
                            "request_date":         r.request_date.isoformat() if pd.notnull(r.request_date) else None,
                            "status":               status,
                        },
                    )
                    self.sleep()
            if not loop:
                break


# ────────────────────────────────────────────────────────────────────
# Warehouse Inventory Producer  —  topic: warehouse.inventory.updates
# ────────────────────────────────────────────────────────────────────
class WarehouseInventoryProducer(BaseProducer):

    def __init__(self, delay=0.001):
        super().__init__("WarehouseInventoryProducer", "warehouse.inventory.updates", delay)

    def produce(self, loop=False):
        df = pd.read_csv(
            os.path.join(DATA_DIR, "T_WAREHOUSE_INVENTORY.csv"),
            encoding_errors="replace",
        )
        self.log.info(f"{len(df):,} warehouse rows loaded")

        while True:
            for r in df.itertuples(index=False):
                qty   = int(r.quantity)
                event = "WAREHOUSE_STOCK_LOW" if qty < 20 else "WAREHOUSE_STOCK_UPDATED"

                self.send(
                    key=f"{r.warehouse_id}:{r.medication_id}",
                    event_type=event,
                    payload={
                        "w_inventory_id": int(r.w_inventory_id),
                        "warehouse_id":   int(r.warehouse_id),
                        "warehouse_code": str(r.warehouse_code),
                        "medication_id":  int(r.medication_id),
                        "medication_name":str(r.medication_name),
                        "category":       str(r.category),
                        "price_per_unit": float(r.price_per_unit),
                        "quantity":       qty,
                    },
                )
                self.sleep()
            if not loop:
                break


# ────────────────────────────────────────────────────────────────────
# Registry & Runner
# ────────────────────────────────────────────────────────────────────
REGISTRY = {
    "orders":        OrdersProducer,
    "order_details": OrderDetailsProducer,
    "sales":         SalesProducer,
    "inventory":     PharmInventoryProducer,
    "warehouse":     WarehouseInventoryProducer,
    "exchange":      ExchangeProducer,
    "expiry":        ExpiryAlertProducer,
}


def _run(cls, loop, delay):
    try:
        with cls(delay=delay) as p:
            p.produce(loop=loop)
    except Exception as e:
        print(f"[ERROR] {cls.__name__}: {e}")


def main():
    parser = argparse.ArgumentParser(description="Pharmacy Kafka Producers")
    parser.add_argument("--topic",  choices=list(REGISTRY.keys()) + ["all"], default="all")
    parser.add_argument("--loop",   action="store_true")
    parser.add_argument("--delay",  type=float, default=0.001)
    args = parser.parse_args()

    selected = list(REGISTRY.items()) if args.topic == "all" else [(args.topic, REGISTRY[args.topic])]

    print(f"\n{'═'*55}")
    print(f"  Kafka  : {KAFKA_SERVERS}")
    print(f"  Topics : {[k for k, _ in selected]}")
    print(f"  Loop   : {args.loop} | Delay: {args.delay}s")
    print(f"{'═'*55}\n")

    threads = [
        threading.Thread(target=_run, args=(cls, args.loop, args.delay),
                        daemon=True, name=f"producer-{name}")
        for name, cls in selected
    ]
    for t in threads: t.start()
    for t in threads: t.join()
    print("\nAll producers finished.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopped by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\nFatal error: {e}")
        sys.exit(1)
    def on_success(metadata):
        print("Sent:", metadata)

    def on_error(e):
        print("Error:", e)
        producer.send("topic", value=data).add_callback(on_success).add_errback(on_error)