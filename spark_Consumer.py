# -*- coding: utf-8 -*-
import json
import pyspark.sql.functions as F
from pyspark.sql.functions import min as spark_min
from pyspark.sql.functions import max as spark_max
from pyspark.sql import SparkSession
from pyspark.sql.functions import (quarter ,avg,month, year, current_timestamp, datediff, from_json,col, regexp_replace,sum,count, to_timestamp, trim, upper, when,window,lit, round)
from pyspark.sql.types import (StructType,StructField,StringType,IntegerType,DoubleType)
# 

# Spark Session
# __________________________________________________________________________

spark = (
    SparkSession.builder
    .appName("PharmacyRealtimeAnalytics")
    .config("spark.jars.packages",
        "org.apache.spark:spark-sql-kafka-0-10_2.12:3.3.0")
    # .config("spark.sql.extensions",
    #         "io.delta.sql.DeltaSparkSessionExtension")
    # .config("spark.sql.catalog.spark_catalog",
    #         "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .config("spark.sql.shuffle.partitions", "16")
    .config("spark.hadoop.fs.defaultFS","hdfs://namenode:8020")
    .config("spark.hadoop.dfs.client.use.datanode.hostname", "true")
    .getOrCreate()
)
spark.sparkContext.setLogLevel("ERROR")

# ─────────────────────────────────────────────────────────────────────────────
# Delta write helper — foreachBatch مع merge (update) أو append
# ─────────────────────────────────────────────────────────────────────────────

def delta_update(table_path, merge_keys: list):
    def _write(batch_df, batch_id):
        if batch_df.isEmpty():
            return
        (
            batch_df.write
            .format("parquet")
            .mode("overwrite")
            .option("overwriteSchema", "true")
            .save(table_path)
        )
    return _write


def delta_append(table_path):
    """foreachBatch function بتعمل append على Delta table."""
    def _write(batch_df, batch_id):
        if batch_df.isEmpty():
            return
        batch_df.write.format("parquet").mode("append").save(table_path)
    return _write

# __________________________________________________________________________
# Kafka Message Schema
# __________________________________________________________________________

# __________________________________________________________________________
# Read Stream From Kafka
# __________________________________________________________________________
    
kafka_df = (
    spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", "kafka:9092,kafka2:9093,kafka3:9094")
    .option("subscribe", ",".join([
        "pharmacy.sales",
        "pharmacy.orders",
        "pharmacy.inventory.updates",
        "pharmacy.expiry.alerts",
        "pharmacy.exchange",
        "warehouse.inventory.updates",
        "pharmacy.order.details",
        "pharmacy.dlq"
    ]))
    .option("startingOffsets", "earliest")
    .option("maxOffsetsPerTrigger", "10000")
    .option("minPartitions", "5")
    .option("failOnDataLoss", "false")
    .load()
    .selectExpr("CAST(value AS STRING) as value","topic")
)

# query = (
#     test_df.writeStream
#     .format("console")
#     .outputMode("append")
#     .option("truncate", "false")
#     .start()
# )


# Thresholds
LOW_STOCK_QTY        = 20     # pharmacy inventory low-stock threshold
WAREHOUSE_LOW_QTY    = 50     # warehouse low-stock threshold
DEAD_STOCK_DAYS      = 30     # days without a sale → "dead stock"
SLOW_MOVER_DAYS      = 14     # days with very few sales → "slow mover"
SLOW_MOVER_MAX_SALES = 5      # max sales in SLOW_MOVER_DAYS to be "slow"
EXPIRY_URGENT_DAYS   = 7      # days left → URGENT
EXPIRY_WARNING_DAYS  = 30 
WAREHOUSE_MIN_SAFETY = 80 


# Kafka Message Schema (Corrected Version)
# __________________________________________________________________________


# =========================================================
# COMMON EVENT SCHEMA
# =========================================================

base_event_schema = StructType([

    StructField("event_id", StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("producer", StringType(), True),
    StructField("ts", StringType(), True)

])

# =========================================================
# SALES SCHEMA
# topic = pharmacy.sales
# =========================================================

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
        StructField("price_sell",   DoubleType(),  True),
        StructField("total_sales",      DoubleType(),  True),
        StructField("date_out",         StringType(),  True),
    ]), True),

])

# =========================================================
# ORDERS SCHEMA
# topic = pharmacy.orders
# =========================================================

orders_schema = StructType([

    StructField("event_id", StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("producer", StringType(), True),
    StructField("ts", StringType(), True),
    StructField("payload", StructType([

        StructField("order_id", IntegerType(), True),
        StructField("client_id", IntegerType(), True),
        StructField("pharm_id", IntegerType(), True),
        StructField("pharm_name", StringType(), True),
        StructField("order_date", StringType(), True),
        StructField("status", StringType(), True)
    ]), True),

])


# =========================================================
# ORDER DETAILS SCHEMA
# topic = pharmacy.order.details
# =========================================================

order_details_schema = StructType([

    StructField("event_id",   StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("producer",   StringType(), True),
    StructField("ts",         StringType(), True),
    StructField("payload", StructType([
        StructField("order_detail_id",  IntegerType(), True),   # FIX: was missing
        StructField("order_id",         IntegerType(), True),
        StructField("sale_id",          IntegerType(), True),
        StructField("client_id",        IntegerType(), True),
        StructField("pharm_id",         IntegerType(), True),
        StructField("pharm_name",       StringType(), True),
        StructField("warehouse_id",     IntegerType(), True),
        StructField("warehouse_code",   StringType(), True),
        StructField("inventory_id",     IntegerType(), True),
        StructField("medication_id",    IntegerType(), True),
        StructField("medication_name",  StringType(), True),
        StructField("medication_type",  StringType(), True),
        StructField("category",         StringType(), True),
        StructField("quantity",         IntegerType(), True),
        StructField("unit_price",       DoubleType(),  True),
        StructField("line_total",       DoubleType(),  True),
        StructField("order_date",       StringType(),  True),
    ]), True),

])


# =========================================================
# INVENTORY SCHEMA
# topic = pharmacy.inventory.updates
# =========================================================

inventory_schema = StructType([

    StructField("event_id", StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("producer", StringType(), True),
    StructField("ts", StringType(), True),

    StructField("payload", StructType([

        StructField("inventory_id", IntegerType(), True),
        StructField("pharm_id", IntegerType(), True),
        StructField("pharm_name", StringType(), True),
        StructField("warehouse_id", IntegerType(), True),
        StructField("warehouse_code", StringType(), True),
        StructField("medication_id", IntegerType(), True),
        StructField("medication_name", StringType(), True),
        StructField("medication_type", StringType(), True),
        StructField("category", StringType(), True),
        StructField("warehouse_price", DoubleType(), True),
        StructField("price_sell", DoubleType(), True),
        StructField("quantity", IntegerType(), True),
        StructField("availability", StringType(), True),
        StructField("movement_type", StringType(), True),
        StructField("date_in", StringType(), True),
        StructField("date_expiry", StringType(), True)

    ]), True)

])

# =========================================================
# EXPIRY ALERTS SCHEMA
# topic = pharmacy.expiry.alerts
# =========================================================

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
        StructField("event_ts",        StringType(),  True),   # FIX: added
    ]), True),

])

# =========================================================
# EXCHANGE SCHEMA
# topic = pharmacy.exchange
# =========================================================

exchange_schema = StructType([

    StructField("event_id", StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("producer", StringType(), True),
    StructField("ts", StringType(), True),

    StructField("payload", StructType([
        StructField("request_id", IntegerType(), True),
        StructField("from_pharm_id", IntegerType(), True),
        StructField("from_pharm_name", StringType(), True),
        StructField("to_pharm_id", IntegerType(), True),
        StructField("to_pharm_name", StringType(), True),
        StructField("inventory_id", IntegerType(), True),
        StructField("warehouse_id", IntegerType(), True),
        StructField("medication_id", IntegerType(), True),
        StructField("medication_name", StringType(), True),
        StructField("quantity_requested", IntegerType(), True),
        StructField("price_sell", DoubleType(), True),
        StructField("discount_percent", DoubleType(), True),
        StructField("price_after_discount", DoubleType(), True),
        StructField("request_date", StringType(), True),
        StructField("status", StringType(), True)

    ]), True)

])

# =========================================================
# WAREHOUSE INVENTORY SCHEMA
# topic = warehouse.inventory.updates
# =========================================================

warehouse_inventory_schema = StructType([

    StructField("event_id", StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("producer", StringType(), True),
    StructField("ts", StringType(), True),

    StructField("payload", StructType([

        StructField("w_inventory_id", IntegerType(), True),
        StructField("warehouse_id", IntegerType(), True),
        StructField("warehouse_code", StringType(), True),
        StructField("medication_id", IntegerType(), True),
        StructField("medication_name", StringType(), True),
        StructField("category", StringType(), True),
        StructField("price_per_unit", DoubleType(), True),
        StructField("quantity", IntegerType(), True)

    ]), True)

])

# =========================================================
# DLQ SCHEMA
# topic = pharmacy.dlq
# =========================================================

dlq_schema = StructType([
    StructField("error", StringType(), True),
    StructField("original_topic", StringType(), True),
    StructField("key", StringType(), True),
    StructField("payload", StringType(), True),
    StructField("ts", StringType(), True)
])
# __________________________________________________________________________
# Read Stream From Kafka
# __________________________________________________________________________
def parse_topic(df, topic, schema):

    parsed = (
        df.filter(col("topic") == topic)
        .select(from_json(col("value"), schema).alias("data"), col("topic"))
    )

    # DLQ special case
    if topic == "pharmacy.dlq":
        return parsed.select(
            "topic",
            "data.error",
            "data.original_topic",
            "data.key",
            "data.payload",
            "data.ts"
        )

    # Normal topics
    return parsed.select(
        "topic",
        "data.event_id",
        "data.event_type",
        "data.producer",
        "data.ts",
        "data.payload.*"
    )

# ==========================================================================
# PARSE EACH TOPIC
# ==========================================================================

sales_raw          = parse_topic(kafka_df, "pharmacy.sales",             sales_schema)
orders_raw         = parse_topic(kafka_df, "pharmacy.orders",            orders_schema)
inventory_raw      = parse_topic(kafka_df, "pharmacy.inventory.updates", inventory_schema)
expiry_raw         = parse_topic(kafka_df, "pharmacy.expiry.alerts",     expiry_schema)
exchange_raw       = parse_topic(kafka_df, "pharmacy.exchange",          exchange_schema)
warehouse_raw      = parse_topic(kafka_df, "warehouse.inventory.updates",warehouse_inventory_schema)
order_details_raw  = parse_topic(kafka_df, "pharmacy.order.details",     order_details_schema)
dlq_raw            = parse_topic(kafka_df, "pharmacy.dlq",               dlq_schema)
# clean_raw = (
#     sales_raw
#     .unionByName(orders_raw, allowMissingColumns=True)
#     .unionByName(inventory_raw, allowMissingColumns=True)
#     .unionByName(expiry_raw, allowMissingColumns=True)
#     .unionByName(exchange_raw, allowMissingColumns=True)
#     .unionByName(warehouse_raw, allowMissingColumns=True)
#     .unionByName(order_details_raw, allowMissingColumns=True)
# )

# ══════════════════════════════════════════════════════════════════════════════
# CLEANING
# ══════════════════════════════════════════════════════════════════════════════
sales_raw= (
    sales_raw
    .withColumn("pharm_name",       trim(regexp_replace(col("pharm_name"),      r"\s+", " ")))
    .withColumn("medication_name",  trim(col("medication_name")))
    # .withColumn("medication_type",  trim(col("medication_type")))
    # .withColumn("category",         trim(col("category")))
    .withColumn("quantity_ordered", F.abs(col("quantity_ordered")))
    .withColumn("total_sales",      F.abs(col("total_sales")))
    .withColumn("price_sell",   F.abs(col("price_sell")))
    .withColumn("date_out",         to_timestamp("date_out"))
    .withColumn("event_time",       to_timestamp("ts"))
    .filter(col("pharm_id").isNotNull())
    .filter(col("date_out").isNotNull())
)

orders_raw = (
    orders_raw
    .withColumn("pharm_name",  trim(col("pharm_name")))
    .withColumn("status",      upper(trim(col("status"))))
    .withColumn("order_date",  to_timestamp("order_date"))
    .withColumn("event_time",  to_timestamp("ts"))
    .filter(col("order_id").isNotNull())
    .filter(col("order_date").isNotNull())
)

inventory_raw = (
    inventory_raw
    .withColumn("pharm_name",      trim(col("pharm_name")))
    .withColumn("medication_name", trim(col("medication_name")))
    .withColumn("category",        trim(col("category")))
    .withColumn("availability",    upper(trim(col("availability"))))
    .withColumn("movement_type",   trim(col("movement_type")))
    .withColumn("quantity",        F.abs(col("quantity")))
    .withColumn("date_expiry",     to_timestamp("date_expiry"))
    .withColumn("date_in",         to_timestamp("date_in"))
    .withColumn("event_time",      to_timestamp("ts"))
    .filter(col("pharm_id").isNotNull())
)

expiry_raw = (
    expiry_raw
    .withColumn("pharm_name",      trim(col("pharm_name")))
    .withColumn("medication_name", trim(col("medication_name")))
    .withColumn("quantity",        F.abs(col("quantity")))
    .withColumn("date_expiry",     to_timestamp("date_expiry"))
    .withColumn("event_time",      to_timestamp("ts"))
    .withColumn(
        "urgency_label",
        when(col("days_left") <= EXPIRY_URGENT_DAYS,  lit("URGENT"))
        .when(col("days_left") <= EXPIRY_WARNING_DAYS, lit("WARNING"))
        .otherwise(lit("OK"))
    )
    .filter(col("pharm_id").isNotNull())
    .filter(col("date_expiry").isNotNull())
)


exchange_raw = (
    exchange_raw
    .withColumn("from_pharm_name", trim(col("from_pharm_name")))
    .withColumn("to_pharm_name",   trim(col("to_pharm_name")))
    .withColumn("medication_name", trim(col("medication_name")))
    .withColumn("status",          upper(trim(col("status"))))
    .withColumn("discount_percent",     F.abs(col("discount_percent")))
    .withColumn("price_sell",           F.abs(col("price_sell")))
    .withColumn("price_after_discount", F.abs(col("price_after_discount")))
    .withColumn("request_date",    to_timestamp("request_date"))
    .withColumn("event_time",      to_timestamp("ts"))
    .filter(col("from_pharm_id").isNotNull())
)

warehouse_raw = (
    warehouse_raw
    .withColumn("warehouse_code",  trim(col("warehouse_code")))
    .withColumn("medication_name", trim(col("medication_name")))
    .withColumn("category",        trim(col("category")))
    .withColumn("quantity",        F.abs(col("quantity")))
    .withColumn("price_per_unit",  F.abs(col("price_per_unit")))
    .withColumn("event_time",      to_timestamp("ts"))
    .filter(col("warehouse_id").isNotNull())
)



order_details_raw = (
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
)

dlq_raw = dlq_raw .withColumn("event_time", to_timestamp("ts"))


# __________________________________________________________________________
# SALES ANALYTICS
# __________________________________________________________________________

# Revenue per pharmacy per 10-min window
sales_by_pharmacy = (
    sales_raw
    .groupBy("pharm_id", "pharm_name")
    .agg(
        round(sum("total_sales"), 2)              .alias("total_revenue"),
        sum("quantity_ordered")                    .alias("total_quantity"),
        count("*")                                 .alias("transaction_count"),
    )
)

# Revenue by category per 10-min window
sales_by_category = (
    sales_raw
    .groupBy("date_out","pharm_id", "pharm_name")
    .agg(
        round(sum("total_sales"), 2).alias("revenue"),
        sum("quantity_ordered")     .alias("units_sold"),
        count("*")                  .alias("transaction_count"),
    )
)

# sales_analysis = sales_row.groupBy(
#     "pharm_id",
#     "pharm_name"
#     # ,
#     # window(col("date_out"), "30 days")
# ).agg(
#     sum("total_sales").alias("total_revenue"),
#     sum("quantity_ordered").alias("total_quantity"),
#     count("*").alias("transactions_count"),
#     avg("price_sell").alias("avg_price")
# )


top_medications = (
    sales_raw
    .groupBy("pharm_id", "pharm_name", "medication_id", "medication_name")
    .agg(
        round(sum("total_sales"), 2) .alias("revenue"),
        sum("quantity_ordered")       .alias("units_sold"),
        count("*")                    .alias("sale_events"),
    )
)

sales_by_pharmacy_summary = (
    sales_raw
    .groupBy("pharm_id", "pharm_name")
    .agg(
        round(sum("total_sales"), 2).alias("revenue"),
        sum("quantity_ordered")      .alias("units_sold"),
        count("*")                   .alias("transaction_count"),
    ))



# ── [13] Top 10 أدوية + Bottom 10 أدوية لكل صيدلية ──────────────────────────
# Top/Bottom بناءً على الإيراد والكمية
med_performance_per_pharmacy = (
    order_details_raw
    .groupBy("pharm_id", "pharm_name", "medication_id", "medication_name", "category")
    .agg(
        sum("quantity")             .alias("units_ordered"),
        round(sum("line_total"), 2) .alias("revenue"),
        count("*")                  .alias("order_count"),
        round(avg("unit_price"), 2) .alias("avg_price"),
    )
    .withColumn(
        "performance_flag",
        when(col("units_ordered") > 100, lit("HIGH_DEMAND"))
        .when(col("units_ordered") > 30,  lit("MEDIUM_DEMAND"))
        .otherwise(lit("LOW_DEMAND"))
    )
)

















# ── [4] ترتيب الصيدليات: مبيعات + صافي الربح + عدد الطلبات ──────────────────
# صافي الربح = سعر البيع (price_sell في inventory) - سعر الشراء (warehouse_price)

# pharmacy_ranking = (
#     inventory_raw
#     .groupBy("pharm_id", "pharm_name")
#     .agg(
#         round(sum(col("quantity") * col("price_sell")), 2)        .alias("total_sell_value"),
#         round(sum(col("quantity") * col("warehouse_price")), 2)   .alias("total_cost_value"),
#         round(
#             sum(col("quantity") * col("price_sell")) -
#             sum(col("quantity") * col("warehouse_price")), 2
#         ).alias("net_profit"),
#         sum("quantity")                                            .alias("total_stock_qty"),
#     )
#     # إضافة عدد الطلبات من orders
# )

# # دمج مع orders لإضافة عدد الطلبات
# orders_count_per_pharm = (
#     orders_raw
#     .groupBy("pharm_id")
#     .agg(count("*").alias("total_orders"))
# )

# pharmacy_full_ranking = (
#     pharmacy_ranking
#     .join(orders_count_per_pharm, on="pharm_id", how="left")
#     .join(
#         sales_by_pharmacy.select("pharm_id", "total_revenue", "transaction_count"),
#         on="pharm_id", how="left"
#     )
#     .select(
#         "pharm_id", "pharm_name",
#         "total_revenue", "net_profit",
#         "total_sell_value", "total_cost_value",
#         "total_orders", "transaction_count",
#     )
# )

# __________________________________________________________________________
# ORDERS ANALYTICS
# __________________________________________________________________________

# Orders per pharmacy per 10-min window
orders_by_pharmacy = (
    orders_raw
    .groupBy("pharm_id", "pharm_name", "status")
    .agg(count("*").alias("orders_count"))
)
# Orders per status per 10-min window
orders_by_status = (
    orders_raw
    .groupBy("status")
    .agg(count("*").alias("orders_count"))
)

# ── [1] أكتر أنواع الأدوية طلباً لكل صيدلية ─────────────────────────────────
# Source: order_details — أشمل لأن فيها category
most_demanded_per_pharmacy = (
    order_details_raw
    .groupBy("pharm_id", "pharm_name", "medication_id", "medication_name", "category")
    .agg(
        sum("quantity")             .alias("total_qty_ordered"),
        count("*")                  .alias("order_count"),
        round(sum("line_total"), 2) .alias("total_revenue"),
    )
)

current_month = month(current_timestamp())
current_year  = year(current_timestamp())

monthly_demand_avg = (
    order_details_raw
    .filter(
        (month("order_date") == current_month) &
        (year("order_date")  == current_year)
    )
    .groupBy("medication_id", "medication_name", "category")
    .agg(
        round(avg("quantity"), 2)   .alias("avg_qty_per_order"),
        sum("quantity")              .alias("total_qty_this_month"),
        count("*")                   .alias("order_count_this_month"),
    )
)


# ── [3] Sudden Demand Surge — via foreachBatch ────────────────────────────────
# نحتاج الـ base DataFrame بس (بدون double aggregation)
surge_base = (
    order_details_raw
    .withColumn("days_ago", datediff(current_timestamp(), col("order_date")))
    .withColumn(
        "period",
        when(col("days_ago") <= 30, lit("RECENT_30"))
        .when((col("days_ago") > 30) & (col("days_ago") <= 60), lit("PREV_30"))
        .otherwise(lit("OLDER"))
    )
    .filter(col("period").isin("RECENT_30", "PREV_30"))
    .groupBy("medication_id", "medication_name", "category", "period")
    .agg(sum("quantity").alias("total_qty"))
)

def compute_demand_surge(batch_df, batch_id):
    if batch_df.isEmpty():
        return

    # هنا batch_df هو static DataFrame — الـ pivot شغال عادي
    pivoted = (
        batch_df
        .groupBy("medication_id", "medication_name", "category")
        .pivot("period", ["RECENT_30", "PREV_30"])
        .agg(sum("total_qty"))
        .withColumnRenamed("RECENT_30", "qty_recent_30d")
        .withColumnRenamed("PREV_30",   "qty_prev_30d")
        .filter(
            col("qty_recent_30d").isNotNull() &
            col("qty_prev_30d").isNotNull()
        )
        .withColumn(
            "surge_ratio",
            round(col("qty_recent_30d") / (col("qty_prev_30d") + lit(1)), 2)
        )
        .withColumn(
            "surge_flag",
            when(col("surge_ratio") >= 2.0, lit("HIGH_SURGE"))
            .when(col("surge_ratio") >= 1.5, lit("MEDIUM_SURGE"))
            .otherwise(lit("NORMAL"))
        )
        .filter(col("surge_flag").isin("HIGH_SURGE", "MEDIUM_SURGE"))
    )

    if pivoted.isEmpty():
        return

    table_path4 = f"{BASE_PATH}/demand_surge"
    pivoted.write.format("parquet").mode("overwrite").save(f"{BASE_PATH}/demand_surge")



    if DeltaTable.isDeltaTable(spark, table_path):
        dt = DeltaTable.forPath(spark, table_path)
        (
            dt.alias("target")
            .merge(
                pivoted.alias("source"),
                "target.medication_id = source.medication_id"
            )
            .whenMatchedUpdateAll()
            .whenNotMatchedInsertAll()
            .execute()
        )
    else:
        pivoted.write.format("parquet").mode("overwrite").save(table_path)

# ── [7] أكثر الأدوية طلباً لكل صيدلية — مقسّم ربع سنوي ─────────────────────
# Q1: يناير-مارس | Q2: أبريل-يونيو | Q3: يوليو-سبتمبر | Q4: أكتوبر-ديسمبر
quarterly_top_med_per_pharmacy = (
    order_details_raw
    .withColumn("order_year",    year("order_date"))
    .withColumn("order_quarter", quarter("order_date"))
    .withColumn(
        "quarter_label",
        when(col("order_quarter") == 1, lit("Q1 (يناير-مارس)"))
        .when(col("order_quarter") == 2, lit("Q2 (أبريل-يونيو)"))
        .when(col("order_quarter") == 3, lit("Q3 (يوليو-سبتمبر)"))
        .otherwise(lit("Q4 (أكتوبر-ديسمبر)"))
    )
    .groupBy(
        "order_year", "order_quarter", "quarter_label",
        "pharm_id", "pharm_name",
        "medication_id", "medication_name", "category",
    )
    .agg(
        sum("quantity")             .alias("total_qty_ordered"),
        round(sum("line_total"), 2) .alias("total_revenue"),
        count("*")                  .alias("order_count"),
    )
)



# ── [8] أكثر الأدوية طلباً بين كل الصيدليات — مقسّم ربع سنوي ───────────────
quarterly_top_med_network = (
    order_details_raw
    .withColumn("order_year",    year("order_date"))
    .withColumn("order_quarter", quarter("order_date"))
    .withColumn(
        "quarter_label",
        when(col("order_quarter") == 1, lit("Q1 (يناير-مارس)"))
        .when(col("order_quarter") == 2, lit("Q2 (أبريل-يونيو)"))
        .when(col("order_quarter") == 3, lit("Q3 (يوليو-سبتمبر)"))
        .otherwise(lit("Q4 (أكتوبر-ديسمبر)"))
    )
    .groupBy(
        "order_year", "order_quarter", "quarter_label",
        "medication_id", "medication_name", "category",
    )
    .agg(
        sum("quantity")             .alias("total_qty_ordered"),
        round(sum("line_total"), 2) .alias("total_revenue"),
        count("*")                  .alias("order_count"),
        F.approx_count_distinct("pharm_id").alias("pharmacies_ordered"),
    )
)

# ── [9] متوسط الأدوية المش موجودة في كل الصيدليات ───────────────────────────
out_of_stock_avg = (
    inventory_raw
    .filter(col("availability") == "OUT OF STOCK")
    .groupBy("pharm_id", "pharm_name")
    .agg(
        count("*")                      .alias("out_of_stock_count"),
        round(avg("quantity"), 2)       .alias("avg_qty_when_oos"),
        F.approx_count_distinct("medication_id").alias("distinct_meds_oos"),
    )
)



# متوسط عدد الأدوية OOS على مستوى الشبكة
network_oos_avg = (
    inventory_raw
    .filter(col("availability") == "OUT OF STOCK")
    .groupBy("medication_id", "medication_name", "category")
    .agg(
        F.approx_count_distinct("pharm_id").alias("pharmacies_oos_count"),
        sum("quantity")            .alias("total_missing_qty"),
        F.approx_count_distinct("warehouse_id").alias("warehouses_count"),
    )
)

# __________________________________________________________________________
# INVENTORY ANALYTICS
# __________________________________________________________________________

low_stock_alerts = (
    inventory_raw
    .filter(col("quantity") < 35)
    .select(
        "pharm_id", "pharm_name", "inventory_id",
        "medication_id", "medication_name", "category",
        "quantity",  "date_expiry", "event_time",
    )
)


# inventory_df = json_df.filter(col("topic") == "pharmacy.inventory.updates") \
#     .select(from_json(col("value"), inventory_schema).alias("data")) \
#     .select("data.payload.*")


# Inventory summary per pharmacy per 10-min window
inventory_per_pharmacy = (
    inventory_raw
    .groupBy("pharm_id", "pharm_name")
    .agg(
        count("*")                                                .alias("total_items"),
        sum("quantity")                                           .alias("total_quantity"),
        count(when(col("quantity") < 7, True))       .alias("low_stock_items"),
        count(when(col("availability") == "OUT OF STOCK", True))  .alias("out_of_stock_items"),
        count(when(col("quantity") > 200, True))                  .alias("overstocked_items"),
        round(sum(col("quantity") * col("price_sell")), 2)       .alias("total_stock_value"),
    )
)


dead_stock_per_pharmacy = (
    inventory_raw
    .withColumn("days_in_stock", F.datediff(F.current_timestamp(), col("date_in")))
    .withColumn(
        "stock_flag",
        when(
            (col("days_in_stock") > DEAD_STOCK_DAYS) & (col("quantity") > LOW_STOCK_QTY),
            lit("DEAD_STOCK"),
        ).when(
            (col("days_in_stock") > SLOW_MOVER_DAYS) & (col("quantity") > LOW_STOCK_QTY),
            lit("SLOW_MOVER"),
        ).otherwise(lit("NORMAL")),
    )
    .filter(col("stock_flag").isin("DEAD_STOCK", "SLOW_MOVER"))
    .select(
        "pharm_id", "pharm_name",
        "medication_id", "medication_name", "category",
        "quantity", "days_in_stock", "price_sell",
        round(col("quantity") * col("price_sell"), 2).alias("total_stock_value"),
        "stock_flag", "event_time",
    )
)

# ── [14] تقسيم المخزون بالكميات لكل صيدلية ───────────────────────────────────
inventory_stock_level = (
    inventory_raw
    .withColumn("stock_level",
        when(col("quantity") <= 35,  lit("VERY_LOW "))
        .when(col("quantity") <= 80,  lit("MEDIUM "))
        .when(col("quantity") <= 150, lit("SAFE "))
        .when(col("quantity") <= 220, lit("HIGH "))
        .otherwise(lit("VERY_HIGH "))
    )
    .groupBy("pharm_id", "pharm_name", "stock_level")
    .agg(
        count("*")      .alias("med_count"),
        sum("quantity") .alias("total_qty"),
    )
)



# ── [6] معدل سرعة دوران المخزون لكل صيدلية ───────────────────────────────────
inventory_turnover_base = (
    inventory_raw
    .groupBy("pharm_id", "pharm_name")
    .agg(
        round(avg("quantity"), 2).alias("avg_stock_qty"),
        sum("quantity")          .alias("total_stock_qty"),
    )
)

def compute_inventory_turnover(batch_df, batch_id):
    if batch_df.isEmpty():
        return

    try:
        sales_snap = spark.sql("""
            SELECT pharm_id, SUM(quantity_ordered) as total_quantity
            FROM sales_snapshot
            GROUP BY pharm_id
        """)
    except Exception:
        print(f"[Batch {batch_id}] sales_snapshot not ready")
        return

    result = (
        batch_df
        .join(sales_snap, on="pharm_id", how="left")
        .withColumn(
            "turnover_rate",
            round(col("total_quantity") / (col("avg_stock_qty") + lit(1)), 2)
        )
        .withColumn(
            "turnover_label",
            when(col("turnover_rate") >= 3.0, lit("FAST"))
            .when(col("turnover_rate") >= 1.0, lit("NORMAL"))
            .otherwise(lit("SLOW"))
        )
    )

    table_path2 = f"{BASE_PATH}/inventory_turnover"
    result.write.format("parquet").mode("overwrite").save(table_path2)


# ── [12] لكل صيدلية: الأدوية قريبة الانتهاء مع الأعداد والأسعار ─────────────
# ✅ base بدون join
expiry_cost_base = (
    expiry_raw
    .filter(col("days_left") <= EXPIRY_WARNING_DAYS)
    .groupBy("pharm_id", "pharm_name", "medication_id", "medication_name")
    .agg(
        sum("quantity")        .alias("total_qty"),
        spark_min("days_left") .alias("min_days_left"),
        spark_max("days_left") .alias("max_days_left"),
    )
)
def compute_expiry_cost(batch_df, batch_id):
    if batch_df.isEmpty():
        return
    try:
        inv_prices = spark.read.format("parquet").load(f"{BASE_PATH}/inventory") \
            .select("pharm_id", "medication_id", "price_sell") \
            .groupBy("pharm_id", "medication_id") \
            .agg(round(avg("price_sell"), 2).alias("price_sell"))
    except Exception:
        try:
            inv_prices = spark.sql("""
                SELECT pharm_id, medication_id,
                ROUND(AVG(price_sell),2) as price_sell
                FROM inventory_snapshot
                GROUP BY pharm_id, medication_id
            """)
        except Exception:
            print(f"[Batch {batch_id}] inventory data not ready")
            return

    result = (
        batch_df
        .join(inv_prices, on=["pharm_id", "medication_id"], how="left")
        .withColumn("total_value", round(col("total_qty") * col("price_sell"), 2))
        .select(
            "pharm_id", "pharm_name",
            "medication_id", "medication_name",
            "total_qty", "min_days_left", "max_days_left",
            "price_sell", "total_value",
        )
    )

    # ← الإضافة الوحيدة
    expiry_total = (
        result
        .groupBy("pharm_id", "pharm_name")
        .agg(
            count("*")                   .alias("distinct_meds_expiring"),
            sum("total_qty")             .alias("grand_total_qty"),
            round(sum("total_value"), 2) .alias("grand_total_value"),
        )
    )

    for res, path in [
        (result,       f"{BASE_PATH}/expiry_cost"),
        (expiry_total, f"{BASE_PATH}/expiry_total"),
    ]:
        res.write.format("parquet").mode("overwrite").save(path)

# __________________________________________________________________________
# EXPIRY ANALYTICS
#_____________________________________________________________________

# expiry_summary = (
#     expiry_raw
#     .withWatermark("date_expiry", "2 days")
#     .groupBy(window(col("date_expiry"), "1 day"))
#     .agg(
#         count("*").alias("alerts_count"),
#         sum("quantity").alias("affected_quantity"),
#     )
# )

expiry_per_pharmacy = (
    expiry_raw
    .groupBy("pharm_id", "pharm_name")
    .agg(
        count(when(col("urgency_label") == "URGENT",  True)).alias("urgent_count"),
        count(when(col("urgency_label") == "WARNING", True)).alias("warning_count"),
        count(when(col("urgency_label") == "OK",      True)).alias("ok_count"),
        sum("quantity")                                      .alias("total_affected_quantity"),
        spark_min("days_left")                               .alias("min_days_left"),
    )
)

urgent_expiry = (
    expiry_raw
    .filter(col("days_left") <= 30)
    .select(
        "pharm_id", "pharm_name",
        "medication_id", "medication_name", "category",
        "quantity", "days_left", "urgency_label",
        "date_expiry", "event_time",
    )
)


# expiry_raw = clean_df.withWatermark("date_expiry", "1 day")
# expiry_raw = json_df.filter(col("topic") == "pharmacy.expiry.alerts") \
#     .select(from_json(col("value"), expiry_schema).alias("data")) \
#     .select("data.*") \
#     .to_timestamp("date_expiry", "1 day")

# expiry_analysis = expiry_df.groupBy(
#     "urgency",
#     window(col("date_expiry"), "1 day")
# ).agg(
#     count("*").alias("alerts_count"),
#     sum("quantity").alias("affected_quantity")
# )


# __________________________________________________________________________
# EXCHANGE ANALYTICS
# __________________________________________________________________________



# exchange_df = json_df.filter(col("topic") == "pharmacy.exchange") \
#     .select(from_json(col("value"), exchange_schema).alias("data")) \
#     .select("data.*")

# exchange_analysis = exchange_df.groupBy("from_pharm_id","from_pharm_name","status"
# ).agg(
#     count("*").alias("exchange_count"),
#     avg("discount_percent").alias("avg_discount"))

# Exchanges sent per pharmacy per 10-min window
exchange_sent = (
    exchange_raw
    .groupBy("from_pharm_id", "from_pharm_name", "status")
    .agg(
        count("*")                             .alias("exchange_count"),
        sum("quantity_requested")              .alias("total_qty_sent"),
        round(sum("price_after_discount"), 2) .alias("total_value"),
    )
)

# Exchanges received per pharmacy per 10-min window
exchange_received = (
    exchange_raw
    .groupBy("to_pharm_id", "to_pharm_name", "status")
    .agg(
        count("*")                             .alias("exchange_count"),
        sum("quantity_requested")              .alias("total_qty_received"),
        round(sum("price_after_discount"), 2) .alias("total_value"),
    )
)


# ── [10] آخر 3 شهور: أكثر صيدلية بتطلب وبتبعت ───────────────────────────────
# ✅ base بدون join
last_3m_base = (
    order_details_raw
    .filter(datediff(current_timestamp(), col("order_date")) <= 90)
    .groupBy("pharm_id", "pharm_name")
    .agg(
        sum("quantity")             .alias("total_qty_ordered"),
        count("*")                  .alias("order_lines"),
        round(sum("line_total"), 2) .alias("total_order_value"),
    )
)

def compute_last_3m(batch_df, batch_id):
    if batch_df.isEmpty():
        return
    try:
        exchange_data = spark.read.format("parquet").load(f"{BASE_PATH}/exchange_sent") \
            .filter(col("status") == "COMPLETED") \
            .select(
                col("from_pharm_id").alias("pharm_id"),
                col("total_qty_sent").alias("qty_sent_exchange"),
                col("exchange_count").alias("exchange_sent_count"),
            )
    except Exception:
        exchange_data = batch_df.select("pharm_id").limit(0) \
            .withColumn("qty_sent_exchange", lit(None).cast("long")) \
            .withColumn("exchange_sent_count", lit(None).cast("long"))

    result = (
        batch_df
        .join(exchange_data, on="pharm_id", how="left")
        .select(
            "pharm_id", "pharm_name",
            "total_qty_ordered", "order_lines", "total_order_value",
            "qty_sent_exchange", "exchange_sent_count",
        )
    )
    table_path3 = f"{BASE_PATH}/last_3m_activity"
    result.write.format("parquet").mode("overwrite").save(table_path3)





# ── [11] لما صيدلية تحتاج دواء: سعره بعد الخصم مرتب من الأقل للأكبر ─────────
# Source: exchange — الصيدليات اللي عندها الدواء ده مع سعر بعد الخصم
med_price_by_pharmacy_ranked = (
    exchange_raw
    .filter(col("status").isin("APPROVED", "COMPLETED", "PENDING"))
    .groupBy(
        "medication_id", "medication_name",
        "from_pharm_id", "from_pharm_name",
    )
    .agg(
        round(avg("price_sell"), 2)           .alias("original_price"),
        round(avg("discount_percent"), 2)      .alias("avg_discount_pct"),
        round(avg("price_after_discount"), 2)  .alias("price_after_discount"),
        sum("quantity_requested")              .alias("available_qty_sent"),
        count("*")                             .alias("transaction_count"),
    )
)


# ── [15] نظام الموافقة على طلبات التبادل بين الصيدليات ──────────────────────
# ✅ base بدون join
exchange_approval_base = (
    exchange_raw
    .select(
        "request_id", "from_pharm_id", "from_pharm_name",
        "to_pharm_id", "to_pharm_name", "medication_id", "medication_name",
        "quantity_requested", "price_after_discount", "event_time",
    )
)

def compute_exchange_approval(batch_df, batch_id):
    if batch_df.isEmpty():
        return

    try:
        wh_qty = spark.read.format("parquet").load(f"{BASE_PATH}/warehouse") \
            .groupBy("medication_id") \
            .agg(sum("total_quantity").alias("current_warehouse_qty"))
    except Exception:
        print(f"[Batch {batch_id}] warehouse data not ready")
        return

    result = (
        batch_df
        .join(wh_qty, on="medication_id", how="left")
        .withColumn("qty_after_request",
            col("current_warehouse_qty") - col("quantity_requested"))
        .withColumn("approval_status",
            when(col("qty_after_request") >= WAREHOUSE_MIN_SAFETY, lit("APPROVED"))
            .otherwise(lit("REJECTED")))
        .withColumn("rejection_reason",
            when(col("qty_after_request") < WAREHOUSE_MIN_SAFETY,
                F.concat(lit("المخزن سيصبح "),
                        col("qty_after_request").cast("string"),
                        lit(" أقل من الحد الأدنى (80)")))
            .otherwise(lit(None)))
        .select(
            "request_id", "from_pharm_id", "from_pharm_name",
            "to_pharm_id", "to_pharm_name", "medication_id", "medication_name",
            "quantity_requested", "current_warehouse_qty", "qty_after_request",
            "approval_status", "rejection_reason", "price_after_discount",
        )
    )

    table_path1 = f"{BASE_PATH}/exchange_approval"
    result.write.format("parquet").mode("overwrite").save(table_path1)


# 
# ===========WAREHOUSE ANALYTICS ===============================


# Warehouse summary per 10-min window
warehouse_summary = (
    warehouse_raw
    .groupBy("warehouse_id", "warehouse_code")
    .agg(
        count("*")                                              .alias("total_items"),
        sum("quantity")                                         .alias("total_quantity"),
        count(when(col("quantity") < WAREHOUSE_LOW_QTY, True)) .alias("low_stock_items"),
        round(sum(col("quantity") * col("price_per_unit")), 2) .alias("total_stock_value"),
    )
)


# ── [5] أكثر مستودع عليه طلب (بالكمية والسعر) ────────────────────────────────
most_demanded_warehouse = (
    order_details_raw
    .groupBy("warehouse_id", "warehouse_code")
    .agg(
        sum("quantity")             .alias("total_qty_ordered"),
        count("*")                  .alias("order_count"),
        round(sum("line_total"), 2) .alias("total_order_value"),
        round(avg("unit_price"), 2) .alias("avg_unit_price"),
    )
)


warehouse_cheapest_price = (
    warehouse_raw
    .groupBy("medication_id", "medication_name", "category")
    .agg(
        round(spark_min("price_per_unit"), 2)          .alias("cheapest_price"),
        round(spark_max("price_per_unit"), 2)          .alias("max_price"),
        round(
            spark_max("price_per_unit") - spark_min("price_per_unit"), 2
        )                                              .alias("price_range"),
        sum("quantity")                                .alias("total_qty_all_warehouses"),
F.approx_count_distinct("warehouse_id").alias("warehouses_count"),
    )
)


# ── [16] ترتيب المستودعات من أقل سعر لكل دواء + الكمية المتاحة ───────────────
# الصيدلية تقرر تتعامل مع أنهي مستودع بناءً على السعر والكمية
warehouse_price_ranking = (
    warehouse_raw
    .groupBy("medication_id", "medication_name", "category",
            "warehouse_id", "warehouse_code")
    .agg(
        round(spark_min("price_per_unit"), 2).alias("price_per_unit"),
        sum("quantity")                       .alias("available_qty"),
    )
    .withColumn(
        "stock_status",
        when(col("available_qty") == 0,         lit("OUT OF STOCK"))
        .when(col("available_qty") < 50,         lit("LOW STOCK"))
        .when(col("available_qty") < 200,        lit("AVAILABLE"))
        .otherwise(lit("WELL STOCKED"))
    )
)


    # أقل سعر + إجمالي كمية لكل دواء في المخازن
# wh_min_price = (
#         warehouse_snapshot
#         .groupBy("medication_id", "medication_name")
#         .agg(
#             round(F.min("price_per_unit"), 2).alias("cheapest_warehouse_price"),
#             F.sum("quantity")                .alias("available_qty_all_warehouses"),
#             F.count_distinct("warehouse_id") .alias("warehouses_count"),
#         )
#     )

#     # أكتر دواء مبيعاً في هذا الـ micro-batch
# top_sales = (
#         batch_df
#         .orderBy(col("units_sold").desc())
#         .limit(20)
#     )

#     # Join: أكتر مبيعاً + أرخص سعر في المخازن
# ############result = (
#         top_sales
#         .join(wh_min_price, on="medication_id", how="left")
#         .select(
#             "window_start", "window_end",
#             "pharm_id", "pharm_name",
#             top_sales["medication_id"],
#             top_sales["medication_name"],
#             "category",
#             "units_sold",
#             "revenue",
#             "avg_unit_price",
#             # من المخازن
#             "cheapest_warehouse_price",
#             "available_qty_all_warehouses",
#             "warehouses_count",
#             # هامش الربح التقريبي
#             round(
#                 top_sales["avg_unit_price"] - F.col("cheapest_warehouse_price"), 2
#             ).alias("estimated_margin_per_unit"),
#         )
#         .orderBy(col("units_sold").desc())
#     )


# ORDER DETAILS PIPELINE


# Revenue per pharmacy per 10-min window
order_details_by_pharmacy = (
    order_details_raw
    .groupBy("pharm_id", "pharm_name")
    .agg(
        round(sum("line_total"), 2).alias("total_sales"),
        sum("quantity")             .alias("total_quantity"),
        count("*")                  .alias("line_count"),
    )
)


# Revenue by category per 10-min window
order_details_by_category = (
    order_details_raw
    .groupBy("category")
    .agg(
        round(sum("line_total"), 2).alias("revenue"),
        sum("quantity")             .alias("units_sold"),
    )
)

#_____________ DLQ PIPELINE________________________________________

dlq_summary = (dlq_raw
    .groupBy("original_topic")
    .agg(count("*").alias("error_count")))

# =======SNAPSHOTS==============================

def update_orders_snapshot(batch_df, batch_id):

    if not batch_df.isEmpty():
        batch_df.createOrReplaceTempView("orders_snapshot")


def update_sales_snapshot(batch_df, batch_id):

    if not batch_df.isEmpty():
        batch_df.createOrReplaceTempView("sales_snapshot")


#=== PHARMACY RANKING===================

def compute_pharmacy_ranking(batch_df, batch_id):

    if batch_df.isEmpty():
        return

    ph_ranking = (
        batch_df
        .groupBy("pharm_id", "pharm_name")
        .agg(
            round(sum(col("quantity") * col("price_sell")), 2)
                .alias("total_sell_value"),

            round(sum(col("quantity") * col("warehouse_price")), 2)
                .alias("total_cost_value"),

            round(
                sum(col("quantity") * col("price_sell")) -
                sum(col("quantity") * col("warehouse_price")), 2
            ).alias("net_profit"),

            sum("quantity").alias("total_stock_qty")
        )
    )

    try:

        orders_snap = spark.sql("""
            SELECT pharm_id, COUNT(*) as total_orders
            FROM orders_snapshot
            GROUP BY pharm_id
        """)

        sales_snap = spark.sql("""
            SELECT
                pharm_id,
                ROUND(SUM(total_sales),2) as total_revenue,
                COUNT(*) as transaction_count
            FROM sales_snapshot
            GROUP BY pharm_id
        """)

    except Exception:

        print(f"[Batch {batch_id}] snapshots not ready")
        return

    result = (
        ph_ranking
        .join(orders_snap, on="pharm_id", how="left")
        .join(sales_snap, on="pharm_id", how="left")
    )

    (result.write.format("parquet").mode("overwrite").save(f"{BASE_PATH}/pharmacy_ranking"))

# 
#____ OUTPUT PATHS____________________________

# غير السطرين دول في الكود
BASE_PATH = "hdfs://namenode:8020/pharmacy/output"
CKPT_BASE = "hdfs://namenode:8020/pharmacy/checkpoints"
# BASE_PATH = "./output"
# # CKPT_BASE = "./checkpoints"



def start_query(df, name, write_fn, output_mode="update"):
    return (
        df.writeStream
        .outputMode(output_mode)
        .foreachBatch(write_fn)
        .option("checkpointLocation", f"{CKPT_BASE}/{name}")
        # .trigger(processingTime="30 seconds")
        .queryName(name)
        .start()
    )

queries = []

# ── Snapshot streams ──────────────────────────────────────────────────────────
queries.append(
    orders_raw.writeStream
    .outputMode("append")
    .foreachBatch(update_orders_snapshot)
    .option("checkpointLocation", f"{CKPT_BASE}/orders_snapshot")
    .start()
)
queries.append(
    sales_raw.writeStream
    .outputMode("append")
    .option("checkpointLocation", f"{CKPT_BASE}/sales_snapshot")
    .foreachBatch(update_sales_snapshot)
    .start()
)


queries.append(
    exchange_approval_base.writeStream
    .outputMode("append")
    .foreachBatch(compute_exchange_approval)
    .option("checkpointLocation", f"{CKPT_BASE}/exchange_approval")
    # .trigger(processingTime="30 seconds")
    .queryName("exchange_approval")
    .start()
)

# ── Pharmacy ranking ──────────────────────────────────────────────────────────
queries.append(
    inventory_raw.writeStream
    .outputMode("append")
    .option("checkpointLocation", f"{CKPT_BASE}/pharmacy_ranking")
    .foreachBatch(compute_pharmacy_ranking)
    .start()
)

queries.append(
    surge_base.writeStream
    .outputMode("update")
    .foreachBatch(compute_demand_surge)
    .option("checkpointLocation", f"{CKPT_BASE}/demand_surge")
    # .trigger(processingTime="30 seconds")
    .queryName("demand_surge")
    .start()
)

queries.append(
    inventory_turnover_base.writeStream
    .outputMode("update")
    .foreachBatch(compute_inventory_turnover)
    .option("checkpointLocation", f"{CKPT_BASE}/inventory_turnover")
    # .trigger(processingTime="30 seconds")
    .queryName("inventory_turnover")
    .start()
)
queries.append(
    last_3m_base.writeStream
    .outputMode("update")
    .foreachBatch(compute_last_3m)
    .option("checkpointLocation", f"{CKPT_BASE}/last_3m_activity")
    # .trigger(processingTime="30 seconds")
    .queryName("last_3m_activity")
    .start()
)
queries.append(
    expiry_cost_base.writeStream
    .outputMode("update")
    .foreachBatch(compute_expiry_cost)
    .option("checkpointLocation", f"{CKPT_BASE}/expiry_cost")
    # .trigger(processingTime="30 seconds")
    .queryName("expiry_cost")
    .start()
)
# ── aggregations to update ────────────────────────────────────────────────────
update_streams = [
    (sales_by_pharmacy,              "sales",                  ["pharm_id"]),
    (sales_by_pharmacy_summary,       "sales_summary",          ["pharm_id"]),
    (sales_by_category, "sales_category", ["pharm_id", "date_out"]),
    (top_medications,                "top_medications",        ["pharm_id", "medication_id"]),
    (orders_by_pharmacy,             "orders_pharmacy",        ["pharm_id", "status"]),
    (orders_by_status,               "orders_status",          ["status"]),
    (inventory_per_pharmacy,         "inventory",              ["pharm_id"]),
    (expiry_per_pharmacy,            "expiry",                 ["pharm_id"]),
    (exchange_sent,                  "exchange_sent",          ["from_pharm_id", "status"]),
    (exchange_received,              "exchange_received",      ["to_pharm_id", "status"]),
    (warehouse_summary,              "warehouse",              ["warehouse_id"]),
    (warehouse_cheapest_price,       "warehouse_cheapest",     ["medication_id"]),
    (order_details_by_pharmacy,      "order_details",          ["pharm_id"]),
    (order_details_by_category,      "order_details_cat",      ["category"]),
    (dlq_summary,                    "dlq",                    ["original_topic"]),
    (most_demanded_per_pharmacy,     "most_demanded",          ["pharm_id", "medication_id"]),
    (monthly_demand_avg,             "monthly_demand_avg",     ["medication_id"]),
    (most_demanded_warehouse,        "warehouse_demand",       ["warehouse_id"]),
    (quarterly_top_med_per_pharmacy, "quarterly_per_pharmacy", ["order_year", "order_quarter", "pharm_id", "medication_id"]),
    (quarterly_top_med_network,      "quarterly_network",      ["order_year", "order_quarter", "medication_id"]),
    (out_of_stock_avg,               "oos_per_pharmacy",       ["pharm_id"]),
    (network_oos_avg,                "oos_network",            ["medication_id"]),
    (med_price_by_pharmacy_ranked,   "exchange_price_ranked",  ["medication_id", "from_pharm_id"]),
    (med_performance_per_pharmacy,   "med_performance",        ["pharm_id", "medication_id"]),
    (inventory_stock_level,          "stock_levels",           ["pharm_id", "stock_level"]),
    (warehouse_price_ranking,        "warehouse_price_rank",   ["medication_id", "warehouse_id"]),
]

for df, name, keys in update_streams:
    queries.append(
        start_query(
            df, name,
            delta_update(f"{BASE_PATH}/{name}", keys),
            output_mode="update",
        )
    )        

# (inventory_turnover,              "inventory_turnover"),      # [6]
# (quarterly_top_med_per_pharmacy,  "quarterly_per_pharmacy"),  # [7]
# (quarterly_top_med_network,       "quarterly_network"),       # [8]
# (out_of_stock_avg,                "oos_per_pharmacy"),        # [9]
# (network_oos_avg,                 "oos_network"),             # [9]
# (last_3_months_activity,          "last_3m_activity"),        # [10]
# (med_price_by_pharmacy_ranked,    "exchange_price_ranked"),   # [11]
# (expiry_cost_per_pharmacy,        "expiry_cost"),             # [12]
# (expiry_total_per_pharmacy,       "expiry_total"),            # [12]
# (med_performance_per_pharmacy,    "med_performance"),         # [13]
# (inventory_stock_level,           "stock_levels"),            # [14]
# (exchange_approval_system,        "exchange_approval"),       # [15]


# ── filter only to append ─────────────────────────────────────────────────────

append_streams = [
    (low_stock_alerts,   "low_stock" ),
    (dead_stock_per_pharmacy,  "dead_stock" ),
    (urgent_expiry, "urgent_expiry"),
]

for df, name in append_streams:
    queries.append(
        start_query(
            df,
            name,
            delta_append(f"{BASE_PATH}/{name}"),
            output_mode="append",
        )
    )
    

print(f"\n{'═'*50}")
print(f"  Started {len(queries)} streaming queries → Delta Lake")
print(f"  update  (aggregations) : {len(update_streams)}")
print(f"  Append  (filter only)  : {len(append_streams)}")
print(f"  Special (snapshots + ranking) : 3")
print(f"{'═'*50}\n")


# ==========================================================================
# AWAIT TERMINATION
# ==========================================================================

spark.streams.awaitAnyTermination()


