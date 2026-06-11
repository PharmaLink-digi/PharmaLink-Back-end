import * as orderDetailsDB from "../../database/orderDetails.js";
import * as ordersDB from "../../database/orders.js";
import * as salesDB from "../../database/sales.js";
import * as clientDB from "../../database/dbclient.js";
import * as pharmInfoDB from "../../database/pharmInfo.js";
import * as pharmInventoryDB from "../../database/pharmInventory.js";
import * as warehouseDB from "../../database/warehouse.js";
import * as medicationDB from "../../database/medication.js";
import { parseIds, parseFilters } from "../../utils/queryParser.js";
import { sendEvent, TOPICS } from "../../kafka/producer.js";

const allowedFilters = ['order_detail_id', 'order_id', 'sale_id', 'client_id', 'pharm_id', 'inventory_id', 'warehouse_id', 'medication_id'];

const enrichOrderDetail = async (item) => {
    const [order, sale, client, pharmacy, inventory, warehouse, medication] = await Promise.all([
        item.order_id ? ordersDB.getOrderById(item.order_id).catch(()=>null) : null,
        item.sale_id ? salesDB.getSaleById(item.sale_id).catch(()=>null) : null,
        item.client_id ? clientDB.getClientById(item.client_id).catch(()=>null) : null,
        item.pharm_id ? pharmInfoDB.getPharmacyById(item.pharm_id).catch(()=>null) : null,
        item.inventory_id ? pharmInventoryDB.getPharmInventoryById(item.inventory_id).catch(()=>null) : null,
        item.warehouse_id ? warehouseDB.getWarehouseById(item.warehouse_id).catch(()=>null) : null,
        item.medication_id ? medicationDB.getMedicationById(item.medication_id).catch(()=>null) : null
    ]);
    return { ...item, order, sale, client, pharmacy, inventory, warehouse, medication };
};

const validateFKs = async (payload) => {
    if (payload.order_id) {
        const o = await ordersDB.getOrderById(payload.order_id).catch(()=>null);
        if (!o) throw new Error("Invalid order_id");
    }
    if (payload.sale_id) {
        const s = await salesDB.getSaleById(payload.sale_id).catch(()=>null);
        if (!s) throw new Error("Invalid sale_id");
    }
    if (payload.client_id) {
        const c = await clientDB.getClientById(payload.client_id).catch(()=>null);
        if (!c) throw new Error("Invalid client_id");
    }
    if (payload.pharm_id) {
        const p = await pharmInfoDB.getPharmacyById(payload.pharm_id).catch(()=>null);
        if (!p) throw new Error("Invalid pharm_id");
    }
    if (payload.inventory_id) {
        const i = await pharmInventoryDB.getPharmInventoryById(payload.inventory_id).catch(()=>null);
        if (!i) throw new Error("Invalid inventory_id");
    }
    if (payload.warehouse_id) {
        const w = await warehouseDB.getWarehouseById(payload.warehouse_id).catch(()=>null);
        if (!w) throw new Error("Invalid warehouse_id");
    }
    if (payload.medication_id) {
        const m = await medicationDB.getMedicationById(payload.medication_id).catch(()=>null);
        if (!m) throw new Error("Invalid medication_id");
    }
};

export const getAllOrderDetails = async (req, res) => {
    try {
        const ids = parseIds(req);
        const filters = parseFilters(req, allowedFilters);
        const rawData = ids ? await orderDetailsDB.getOrderDetailsByIds(ids, filters) : await orderDetailsDB.getAllOrderDetails(filters);
        const data = await Promise.all(rawData.map(enrichOrderDetail));
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getOrderDetailById = async (req, res) => {
    try {
        const rawData = await orderDetailsDB.getOrderDetailById(req.params.id);
        const data = await enrichOrderDetail(rawData);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const insertOrderDetail = async (req, res) => {
    try {
        await validateFKs(req.body);
        const data = await orderDetailsDB.insertOrderDetail(req.body);
        await sendEvent(TOPICS.ORDER_DETAILS, 'ORDER_DETAIL_CREATED', data.pharm_id, {
            order_detail_id: data.order_detail_id,
            order_id:        data.order_id,
            sale_id:         data.sale_id,
            client_id:       data.client_id,
            pharm_id:        data.pharm_id,
            pharm_name:      data.pharm_name ?? null,
            warehouse_id:    data.warehouse_id,
            warehouse_code:  data.warehouse_code ?? null,
            inventory_id:    data.inventory_id,
            medication_id:   data.medication_id,
            medication_name: data.medication_name ?? null,
            medication_type: data.medication_type ?? null,
            category:        data.category ?? null,
            quantity:        data.quantity,
            unit_price:      data.unit_price,
            line_total:      data.line_total,
            order_date:      data.order_date ?? null,
        });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateOrderDetail = async (req, res) => {
    try {
        await validateFKs(req.body);
        const data = await orderDetailsDB.updateOrderDetail(req.params.id, req.body);
        await sendEvent(TOPICS.ORDER_DETAILS, 'ORDER_DETAIL_CREATED', data.pharm_id, {
            order_detail_id: data.order_detail_id,
            order_id:        data.order_id,
            sale_id:         data.sale_id,
            client_id:       data.client_id,
            pharm_id:        data.pharm_id,
            pharm_name:      data.pharm_name ?? null,
            warehouse_id:    data.warehouse_id,
            warehouse_code:  data.warehouse_code ?? null,
            inventory_id:    data.inventory_id,
            medication_id:   data.medication_id,
            medication_name: data.medication_name ?? null,
            medication_type: data.medication_type ?? null,
            category:        data.category ?? null,
            quantity:        data.quantity,
            unit_price:      data.unit_price,
            line_total:      data.line_total,
            order_date:      data.order_date ?? null,
        });
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteOrderDetail = async (req, res) => {
    try {
        const ids = parseIds(req);
        if (ids) {
            const data = await orderDetailsDB.deleteOrderDetailsByIds(ids);
            return res.status(200).json({ deletedIds: ids, result: data });
        }
        const data = await orderDetailsDB.deleteOrderDetail(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
