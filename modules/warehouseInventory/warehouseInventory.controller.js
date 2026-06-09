import * as warehouseInventoryDB from "../../database/warehouseInventory.js";
import * as warehouseDB from "../../database/warehouse.js";
import * as medicationDB from "../../database/medication.js";
import { parseIds, parseFilters } from "../../utils/queryParser.js";

const allowedFilters = ['w_inventory_id', 'warehouse_id', 'medication_id', 'category'];

// Helper for enrichment
const enrichWarehouseInventory = async (item) => {
    const [warehouse, medication] = await Promise.all([
        item.warehouse_id ? warehouseDB.getWarehouseById(item.warehouse_id).catch(()=>null) : null,
        item.medication_id ? medicationDB.getMedicationById(item.medication_id).catch(()=>null) : null
    ]);
    return { ...item, warehouse, medication };
};

// Helper for validation
const validateFKs = async (payload) => {
    if (payload.warehouse_id) {
        const w = await warehouseDB.getWarehouseById(payload.warehouse_id).catch(()=>null);
        if (!w) throw new Error("Invalid warehouse_id");
    }
    if (payload.medication_id) {
        const m = await medicationDB.getMedicationById(payload.medication_id).catch(()=>null);
        if (!m) throw new Error("Invalid medication_id");
    }
};

export const getAllWarehouseInventory = async (req, res) => {
    try {
        const ids = parseIds(req);
        const filters = parseFilters(req, allowedFilters);
        const rawData = ids ? await warehouseInventoryDB.getWarehouseInventoriesByIds(ids, filters) : await warehouseInventoryDB.getAllWarehouseInventory(filters);
        const data = await Promise.all(rawData.map(enrichWarehouseInventory));
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getWarehouseInventoryById = async (req, res) => {
    try {
        const rawData = await warehouseInventoryDB.getWarehouseInventoryById(req.params.id);
        const data = await enrichWarehouseInventory(rawData);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const insertWarehouseInventory = async (req, res) => {
    try {
        await validateFKs(req.body);
        const data = await warehouseInventoryDB.insertWarehouseInventory(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateWarehouseInventory = async (req, res) => {
    try {
        await validateFKs(req.body);
        const data = await warehouseInventoryDB.updateWarehouseInventory(req.params.id, req.body);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteWarehouseInventory = async (req, res) => {
    try {
        const ids = parseIds(req);
        if (ids) {
            const data = await warehouseInventoryDB.deleteWarehouseInventoriesByIds(ids);
            return res.status(200).json({ deletedIds: ids, result: data });
        }
        const data = await warehouseInventoryDB.deleteWarehouseInventory(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
