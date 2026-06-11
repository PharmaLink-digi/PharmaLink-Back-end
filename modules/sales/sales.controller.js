import * as salesDB from "../../database/sales.js";
import * as ordersDB from "../../database/orders.js";
import * as clientDB from "../../database/dbclient.js";
import * as pharmInfoDB from "../../database/pharmInfo.js";
import * as pharmInventoryDB from "../../database/pharmInventory.js";
import * as warehouseDB from "../../database/warehouse.js";
import * as medicationDB from "../../database/medication.js";
import { parseIds, parseFilters } from "../../utils/queryParser.js";
import { sendEvent, TOPICS } from "../../kafka/producer.js";

const allowedFilters = ['sale_id', 'order_id', 'client_id', 'pharm_id', 'inventory_id', 'warehouse_id', 'medication_id'];

const enrichSale = async (item) => {
    const [order, client, pharmacy, inventory, warehouse, medication] = await Promise.all([
        item.order_id ? ordersDB.getOrderById(item.order_id).catch(()=>null) : null,
        item.client_id ? clientDB.getClientById(item.client_id).catch(()=>null) : null,
        item.pharm_id ? pharmInfoDB.getPharmacyById(item.pharm_id).catch(()=>null) : null,
        item.inventory_id ? pharmInventoryDB.getPharmInventoryById(item.inventory_id).catch(()=>null) : null,
        item.warehouse_id ? warehouseDB.getWarehouseById(item.warehouse_id).catch(()=>null) : null,
        item.medication_id ? medicationDB.getMedicationById(item.medication_id).catch(()=>null) : null
    ]);
    return { ...item, order, client, pharmacy, inventory, warehouse, medication };
};

const validateFKs = async (payload) => {
    if (payload.order_id) {
        const o = await ordersDB.getOrderById(payload.order_id).catch(()=>null);
        if (!o) throw new Error("Invalid order_id");
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

export const getAllSales = async (req, res) => {
    try {
        const ids = parseIds(req);
        const filters = parseFilters(req, allowedFilters);
        const rawData = ids ? await salesDB.getSalesByIds(ids, filters) : await salesDB.getAllSales(filters);
        const data = await Promise.all(rawData.map(enrichSale));
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getSaleById = async (req, res) => {
    try {
        const rawData = await salesDB.getSaleById(req.params.id);
        const data = await enrichSale(rawData);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const insertSale = async (req, res) => {
    try {
        await validateFKs(req.body);
        const data = await salesDB.insertSale(req.body);
        await sendEvent(TOPICS.SALES, 'SALE_COMPLETED', data.pharm_id, {
            sale_id:          data.sale_id,
            order_id:         data.order_id,
            client_id:        data.client_id,
            pharm_id:         data.pharm_id,
            pharm_name:       data.pharm_name ?? null,
            inventory_id:     data.inventory_id,
            warehouse_id:     data.warehouse_id,
            medication_id:    data.medication_id,
            medication_name:  data.medication_name ?? null,
            quantity_ordered: data.quantity_ordered,
            price_per_unit:   data.price_per_unit,
            total_sales:      data.total_sales,
            date_out:         data.date_out ?? null,
        });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateSale = async (req, res) => {
    try {
        await validateFKs(req.body);
        const data = await salesDB.updateSale(req.params.id, req.body);
        await sendEvent(TOPICS.SALES, 'SALE_COMPLETED', data.pharm_id, {
            sale_id:          data.sale_id,
            order_id:         data.order_id,
            client_id:        data.client_id,
            pharm_id:         data.pharm_id,
            pharm_name:       data.pharm_name ?? null,
            inventory_id:     data.inventory_id,
            warehouse_id:     data.warehouse_id,
            medication_id:    data.medication_id,
            medication_name:  data.medication_name ?? null,
            quantity_ordered: data.quantity_ordered,
            price_per_unit:   data.price_per_unit,
            total_sales:      data.total_sales,
            date_out:         data.date_out ?? null,
        });
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteSale = async (req, res) => {
    try {
        const ids = parseIds(req);
        if (ids) {
            const data = await salesDB.deleteSalesByIds(ids);
            return res.status(200).json({ deletedIds: ids, result: data });
        }
        const data = await salesDB.deleteSale(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
