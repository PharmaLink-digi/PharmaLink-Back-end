# -*- coding: utf-8 -*-
# """
# Pharmacy Spark Consumer — Clean Only
# مهمته الوحيدة:
#    1. يقرأ من Kafka
#   2. يعمل parse + clean لكل topic
#   3. يكتب الداتا النظيفة على HDFS كـ Parquet
#   4. باقي أي analytics تتعمل في PowerBI أو Grafana

# Output paths (HDFS):
# hdfs://namenode:8020/pharmacy/clean/sales
# hdfs://namenode:8020/pharmacy/clean/orders
# hdfs://namenode:8020/pharmacy/clean/inventory
# hdfs://namenode:8020/pharmacy/clean/expiry
# hdfs://namenode:8020/pharmacy/clean/exchange
# hdfs://namenode:8020/pharmacy/clean/warehouse
# hdfs://namenode:8020/pharmacy/clean/order_details
# hdfs://namenode:8020/pharmacy/clean/dlq
# """

import pyspark.sql.functions as F
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, from_json, regexp_replace, to_timestamp, trim, upper, when, lit,
)
from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType, DoubleType,
)

# ─────────────────────────────────────────────────────────────────────────────
# Spark Session
# ─────────────────────────────────────────────────────────────────────────────
spark = (
    SparkSession.builder
    .appName("PharmacyCleanConsumer")
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.1")
    .config("spark.sql.shuffle.partitions", "8")
    .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:8020")
    .config("spark.hadoop.dfs.client.use.datanode.hostname", "true")
    .getOrCreate()
)
spark.sparkContext.setLogLevel("ERROR")

# ─────────────────────────────────────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────────────────────────────────────
HDFS_CLEAN = "hdfs://namenode:8020/pharmacy/clean"
HDFS_CKPT  = "hdfs://namenode:8020/pharmacy/checkpoints"

# ─────────────────────────────────────────────────────────────────────────────
# Kafka
# ─────────────────────────────────────────────────────────────────────────────
kafka_df = (
    spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", "localhost:29092,localhost:29093,localhost:29094")
    .option("subscribe", ",".join([
        "pharmacy.sales",
        "pharmacy.orders",
        "pharmacy.inventory.updates",
        "pharmacy.expiry.alerts",
        "pharmacy.exchange",
        "warehouse.inventory.updates",
        "pharmacy.order.details",
        "pharmacy.dlq",
    ]))
    .option("startingOffsets",      "earliest")
    .option("maxOffsetsPerTrigger", "10000")
    .option("minPartitions",        "5")
    .option("failOnDataLoss",       "false")
    .load()
    .selectExpr("CAST(value AS STRING) as value", "topic")
)

# ─────────────────────────────────────────────────────────────────────────────
# Schemas — نفس الـ schemas بالظبط من الكود الأصلي
# ─────────────────────────────────────────────────────────────────────────────
sales_schema = StructType([
    StructField("event_id",   StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("producer",   StringType(), True),
    StructField("ts",         StringType(), True),
    StructField("payload", StructType([
        StructField("sale_id",          IntegerType(), True),
        StructField("order_id",         IntegerType(), True),
        StructField("client_id",        IntegerType(), True),
        StructField("pharm_id",         IntegerType(), True),
        StructField("pharm_name",       StringType(), True),
        StructField("inventory_id",     IntegerType(), True),
        StructField("warehouse_id",     IntegerType(), True),
        StructField("medication_id",    IntegerType(), True),
        StructField("medication_name",  StringType(), True),
        StructField("quantity_ordered", IntegerType(), True),
        StructField("price_sell",       DoubleType(),  True),
        StructField("total_sales",      DoubleType(),  True),
        StructField("date_out",         StringType(),  True),
    ]), True),
])

orders_schema = StructType([
    StructField("event_id",   StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("producer",   StringType(), True),
    StructField("ts",         StringType(), True),
    StructField("payload", StructType([
        StructField("order_id",   IntegerType(), True),
        StructField("client_id",  IntegerType(), True),
        StructField("pharm_id",   IntegerType(), True),
        StructField("pharm_name", StringType(), True),
        StructField("order_date", StringType(), True),
        StructField("status",     StringType(), True),
    ]), True),
])

order_details_schema = StructType([
    StructField("event_id",   StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("producer",   StringType(), True),
    StructField("ts",         StringType(), True),
    StructField("payload", StructType([
        StructField("order_detail_id", IntegerType(), True),
        StructField("order_id",        IntegerType(), True),
        StructField("sale_id",         IntegerType(), True),
        StructField("client_id",       IntegerType(), True),
        StructField("pharm_id",        IntegerType(), True),
        StructField("pharm_name",      StringType(), True),
        StructField("warehouse_id",    IntegerType(), True),
        StructField("warehouse_code",  StringType(), True),
        StructField("inventory_id",    IntegerType(), True),
        StructField("medication_id",   IntegerType(), True),
        StructField("medication_name", StringType(), True),
        StructField("medication_type", StringType(), True),
        StructField("category",        StringType(), True),
        StructField("quantity",        IntegerType(), True),
        StructField("unit_price",      DoubleType(),  True),
        StructField("line_total",      DoubleType(),  True),
        StructField("order_date",      StringType(),  True),
    ]), True),
])

inventory_schema = StructType([
    StructField("event_id",   StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("producer",   StringType(), True),
    StructField("ts",         StringType(), True),
    StructField("payload", StructType([
        StructField("inventory_id",    IntegerType(), True),
        StructField("pharm_id",        IntegerType(), True),
        StructField("pharm_name",      StringType(), True),
        StructField("warehouse_id",    IntegerType(), True),
        StructField("warehouse_code",  StringType(), True),
        StructField("medication_id",   IntegerType(), True),
        StructField("medication_name", StringType(), True),
        StructField("medication_type", StringType(), True),
        StructField("category",        StringType(), True),
        StructField("warehouse_price", DoubleType(),  True),
        StructField("price_sell",      DoubleType(),  True),
        StructField("quantity",        IntegerType(), True),
        StructField("availability",    StringType(),  True),
        StructField("movement_type",   StringType(),  True),
        StructField("date_in",         StringType(),  True),
        StructField("date_expiry",     StringType(),  True),
    ]), True),
])

expiry_schema = StructType([
    StructField("event_id",   StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("producer",   StringType(), True),
    StructField("ts",         StringType(), True),
    StructField("payload", StructType([
        StructField("inventory_id",    IntegerType(), True),
        StructField("pharm_id",        IntegerType(), True),
        StructField("pharm_name",      StringType(), True),
        StructField("warehouse_id",    IntegerType(), True),
        StructField("warehouse_code",  StringType(), True),
        StructField("medication_id",   IntegerType(), True),
        StructField("medication_name", StringType(), True),
        StructField("medication_type", StringType(), True),
        StructField("category",        StringType(), True),
        StructField("quantity",        IntegerType(), True),
        StructField("movement_type",   StringType(),  True),
        StructField("availability",    StringType(),  True),
        StructField("date_expiry",     StringType(),  True),
        StructField("days_left",       IntegerType(), True),
        StructField("event_ts",        StringType(),  True),
    ]), True),
])

exchange_schema = StructType([
    StructField("event_id",   StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("producer",   StringType(), True),
    StructField("ts",         StringType(), True),
    StructField("payload", StructType([
        StructField("request_id",          IntegerType(), True),
        StructField("from_pharm_id",        IntegerType(), True),
        StructField("from_pharm_name",      StringType(), True),
        StructField("to_pharm_id",          IntegerType(), True),
        StructField("to_pharm_name",        StringType(), True),
        StructField("inventory_id",         IntegerType(), True),
        StructField("warehouse_id",         IntegerType(), True),
        StructField("medication_id",        IntegerType(), True),
        StructField("medication_name",      StringType(), True),
        StructField("quantity_requested",   IntegerType(), True),
        StructField("price_sell",           DoubleType(),  True),
        StructField("discount_percent",     DoubleType(),  True),
        StructField("price_after_discount", DoubleType(),  True),
        StructField("request_date",         StringType(),  True),
        StructField("status",               StringType(),  True),
    ]), True),
])

warehouse_inventory_schema = StructType([
    StructField("event_id",   StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("producer",   StringType(), True),
    StructField("ts",         StringType(), True),
    StructField("payload", StructType([
        StructField("w_inventory_id",  IntegerType(), True),
        StructField("warehouse_id",    IntegerType(), True),
        StructField("warehouse_code",  StringType(), True),
        StructField("medication_id",   IntegerType(), True),
        StructField("medication_name", StringType(), True),
        StructField("category",        StringType(), True),
        StructField("price_per_unit",  DoubleType(),  True),
        StructField("quantity",        IntegerType(), True),
    ]), True),
])

dlq_schema = StructType([
    StructField("error",          StringType(), True),
    StructField("original_topic", StringType(), True),
    StructField("key",            StringType(), True),
    StructField("payload",        StringType(), True),
    StructField("ts",             StringType(), True),
])

# ─────────────────────────────────────────────────────────────────────────────
# Parse helper
# ─────────────────────────────────────────────────────────────────────────────
def parse_topic(df, topic, schema):
    parsed = (
        df.filter(col("topic") == topic)
        .select(from_json(col("value"), schema).alias("data"), col("topic"))
    )
    if topic == "pharmacy.dlq":
        return parsed.select(
            "topic", "data.error", "data.original_topic",
            "data.key", "data.payload", "data.ts",
        )
    return parsed.select(
        "topic", "data.event_id", "data.event_type",
        "data.producer", "data.ts", "data.payload.*",
    )

# ─────────────────────────────────────────────────────────────────────────────
# Parse topics
# ─────────────────────────────────────────────────────────────────────────────
sales_raw         = parse_topic(kafka_df, "pharmacy.sales",              sales_schema)
orders_raw        = parse_topic(kafka_df, "pharmacy.orders",             orders_schema)
inventory_raw     = parse_topic(kafka_df, "pharmacy.inventory.updates",  inventory_schema)
expiry_raw        = parse_topic(kafka_df, "pharmacy.expiry.alerts",      expiry_schema)
exchange_raw      = parse_topic(kafka_df, "pharmacy.exchange",           exchange_schema)
warehouse_raw     = parse_topic(kafka_df, "warehouse.inventory.updates", warehouse_inventory_schema)
order_details_raw = parse_topic(kafka_df, "pharmacy.order.details",      order_details_schema)
dlq_raw           = parse_topic(kafka_df, "pharmacy.dlq",                dlq_schema)

# ─────────────────────────────────────────────────────────────────────────────
# CLEANING — نفس الكود الأصلي بالظبط، مش بنغير فيه
# ─────────────────────────────────────────────────────────────────────────────

# ── SALES ─────────────────────────────────────────────────────────────────────
sales_clean = (
    sales_raw
    .withColumn("pharm_name",       trim(regexp_replace(col("pharm_name"), r"\s+", " ")))
    .withColumn("medication_name",  trim(col("medication_name")))
    .withColumn("quantity_ordered", F.abs(col("quantity_ordered")))
    .withColumn("total_sales",      F.abs(col("total_sales")))
    .withColumn("price_sell",       F.abs(col("price_sell")))
    .withColumn("date_out",         to_timestamp("date_out"))
    .withColumn("event_time",       to_timestamp("ts"))
    .filter(col("pharm_id").isNotNull())
    .filter(col("date_out").isNotNull())
    # شيل الـ Kafka metadata مش محتاجها في الداتا النهائية
    .drop("topic", "event_id", "event_type", "producer", "ts")
)

# ── ORDERS ────────────────────────────────────────────────────────────────────
orders_clean = (
    orders_raw
    .withColumn("pharm_name", trim(col("pharm_name")))
    .withColumn("status",     upper(trim(col("status"))))
    .withColumn("order_date", to_timestamp("order_date"))
    .withColumn("event_time", to_timestamp("ts"))
    .filter(col("order_id").isNotNull())
    .filter(col("order_date").isNotNull())
    .drop("topic", "event_id", "event_type", "producer", "ts")
)

# ── INVENTORY ─────────────────────────────────────────────────────────────────
inventory_clean = (
    inventory_raw
    .withColumn("pharm_name",      trim(col("pharm_name")))
    .withColumn("medication_name", trim(col("medication_name")))
    .withColumn("category",        trim(col("category")))
    .withColumn("availability",    upper(trim(col("availability"))))
    .withColumn("movement_type",   trim(col("movement_type")))
    .withColumn("quantity",        F.abs(col("quantity")))
    .withColumn("warehouse_price", F.abs(col("warehouse_price")))
    .withColumn("price_sell",      F.abs(col("price_sell")))
    .withColumn("date_expiry",     to_timestamp("date_expiry"))
    .withColumn("date_in",         to_timestamp("date_in"))
    .withColumn("event_time",      to_timestamp("ts"))
    .filter(col("pharm_id").isNotNull())
    .drop("topic", "event_id", "event_type", "producer", "ts")
)

# ── EXPIRY ─────────────────────────────────────────────────────────────────────
expiry_clean = (
    expiry_raw
    .withColumn("pharm_name",      trim(col("pharm_name")))
    .withColumn("medication_name", trim(col("medication_name")))
    .withColumn("quantity",        F.abs(col("quantity")))
    .withColumn("date_expiry",     to_timestamp("date_expiry"))
    .withColumn("event_time",      to_timestamp("ts"))
    # urgency_label حاجة مفيدة للـ BI tool — بنحسبها هنا عشان توفر وقت
    .withColumn("urgency_label",
        when(col("days_left") <= 7,  lit("URGENT"))
        .when(col("days_left") <= 30, lit("WARNING"))
        .otherwise(lit("OK")))
    .filter(col("pharm_id").isNotNull())
    .filter(col("date_expiry").isNotNull())
    .drop("topic", "event_id", "event_type", "producer", "ts")
)

# ── EXCHANGE ───────────────────────────────────────────────────────────────────
exchange_clean = (
    exchange_raw
    .withColumn("from_pharm_name",      trim(col("from_pharm_name")))
    .withColumn("to_pharm_name",        trim(col("to_pharm_name")))
    .withColumn("medication_name",      trim(col("medication_name")))
    .withColumn("status",               upper(trim(col("status"))))
    .withColumn("discount_percent",     F.abs(col("discount_percent")))
    .withColumn("price_sell",           F.abs(col("price_sell")))
    .withColumn("price_after_discount", F.abs(col("price_after_discount")))
    .withColumn("request_date",         to_timestamp("request_date"))
    .withColumn("event_time",           to_timestamp("ts"))
    .filter(col("from_pharm_id").isNotNull())
    .drop("topic", "event_id", "event_type", "producer", "ts")
)

# ── WAREHOUSE ──────────────────────────────────────────────────────────────────
warehouse_clean = (
    warehouse_raw
    .withColumn("warehouse_code",  trim(col("warehouse_code")))
    .withColumn("medication_name", trim(col("medication_name")))
    .withColumn("category",        upper(trim(col("category"))))
    .withColumn("quantity",        F.abs(col("quantity")))
    .withColumn("price_per_unit",  F.abs(col("price_per_unit")))
    .withColumn("event_time",      to_timestamp("ts"))
    .filter(col("warehouse_id").isNotNull())
    .drop("topic", "event_id", "event_type", "producer", "ts")
)

# ── ORDER DETAILS ──────────────────────────────────────────────────────────────
order_details_clean = (
    order_details_raw
    .withColumn("pharm_name",      trim(col("pharm_name")))
    .withColumn("medication_name", trim(col("medication_name")))
    .withColumn("category",        trim(col("category")))
    .withColumn("quantity",        F.abs(col("quantity")))
    .withColumn("unit_price",      F.abs(col("unit_price")))
    .withColumn("line_total",      F.abs(col("line_total")))
    .withColumn("order_date",      to_timestamp("order_date"))
    .withColumn("event_time",      to_timestamp("ts"))
    .filter(col("order_id").isNotNull())
    .filter(col("order_date").isNotNull())
    .drop("topic", "event_id", "event_type", "producer", "ts")
)

# ── DLQ ────────────────────────────────────────────────────────────────────────
dlq_clean = (
    dlq_raw
    .withColumn("event_time", to_timestamp("ts"))
    .drop("topic", "ts")
)

# ─────────────────────────────────────────────────────────────────────────────
# Write helper — append فقط، مفيش analytics مفيش upsert
# ─────────────────────────────────────────────────────────────────────────────
def write_clean(df, name):
    return (
        df.writeStream
        .outputMode("append")
        .format("parquet")
        .option("path",               f"{HDFS_CLEAN}/{name}")
        .option("checkpointLocation", f"{HDFS_CKPT}/{name}")
        .trigger(processingTime="30 seconds")
        .queryName(f"clean_{name}")
        .start()
    )

# ─────────────────────────────────────────────────────────────────────────────
# Start all 8 clean streams
# ─────────────────────────────────────────────────────────────────────────────
queries = [
    write_clean(sales_clean,         "sales"),
    write_clean(orders_clean,        "orders"),
    write_clean(inventory_clean,     "inventory"),
    write_clean(expiry_clean,        "expiry"),
    write_clean(exchange_clean,      "exchange"),
    write_clean(warehouse_clean,     "warehouse"),
    write_clean(order_details_clean, "order_details"),
    write_clean(dlq_clean,           "dlq"),
]

print(f"\n{'═'*55}")
print(f"  PharmacyCleanConsumer started — {len(queries)} streams")
print(f"  Output : {HDFS_CLEAN}/")
print(f"  Topics : sales | orders | inventory | expiry")
print(f"           exchange | warehouse | order_details | dlq")
print(f"{'═'*55}\n")

spark.streams.awaitAnyTermination()