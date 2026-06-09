import * as pharmInventoryDB from "../../database/pharmInventory.js";
import * as pharmInfoDB from "../../database/pharmInfo.js";
import * as warehouseDB from "../../database/warehouse.js";
import * as medicationDB from "../../database/medication.js";
import { parseIds, parseFilters } from "../../utils/queryParser.js";

const allowedFilters = ['inventory_id', 'pharm_id', 'warehouse_id', 'medication_id', 'category', 'movement_type', 'availability'];

// Helper for enrichment
const enrichPharmInventory = async (item) => {
    const [pharmacy, warehouse, medication] = await Promise.all([
        item.pharm_id ? pharmInfoDB.getPharmacyById(item.pharm_id).catch(()=>null) : null,
        item.warehouse_id ? warehouseDB.getWarehouseById(item.warehouse_id).catch(()=>null) : null,
        item.medication_id ? medicationDB.getMedicationById(item.medication_id).catch(()=>null) : null
    ]);
    return { ...item, pharmacy, warehouse, medication };
};

// Helper for validation
const validateFKs = async (payload) => {
    if (payload.pharm_id) {
        const p = await pharmInfoDB.getPharmacyById(payload.pharm_id).catch(()=>null);
        if (!p) throw new Error("Invalid pharm_id");
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

export const getAllPharmInventory = async (req, res) => {
    try {
        const ids = parseIds(req);
        const filters = parseFilters(req, allowedFilters);
        const rawData = ids ? await pharmInventoryDB.getPharmInventoriesByIds(ids, filters) : await pharmInventoryDB.getAllPharmInventory(filters);
        const data = await Promise.all(rawData.map(enrichPharmInventory));
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getPharmInventoryById = async (req, res) => {
    try {
        const rawData = await pharmInventoryDB.getPharmInventoryById(req.params.id);
        const data = await enrichPharmInventory(rawData);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const insertPharmInventory = async (req, res) => {
    try {
        await validateFKs(req.body);
        const data = await pharmInventoryDB.insertPharmInventory(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updatePharmInventory = async (req, res) => {
    try {
        await validateFKs(req.body);
        const data = await pharmInventoryDB.updatePharmInventory(req.params.id, req.body);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deletePharmInventory = async (req, res) => {
    try {
        const ids = parseIds(req);
        if (ids) {
            const data = await pharmInventoryDB.deletePharmInventoriesByIds(ids);
            return res.status(200).json({ deletedIds: ids, result: data });
        }
        const data = await pharmInventoryDB.deletePharmInventory(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
