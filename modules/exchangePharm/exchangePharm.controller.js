import * as exchangePharmDB from "../../database/exchangePharm.js";
import * as pharmInfoDB from "../../database/pharmInfo.js";
import * as medicationDB from "../../database/medication.js";
import * as pharmInventoryDB from "../../database/pharmInventory.js";
import * as warehouseDB from "../../database/warehouse.js";
import { parseIds, parseFilters } from "../../utils/queryParser.js";

const allowedFilters = ['request_id', 'from_pharm_id', 'to_pharm_id', 'inventory_id', 'warehouse_id', 'medication_id', 'status'];

// Helper for validation
const validateFKs = async (payload) => {
    if (payload.from_pharm_id) {
        const p = await pharmInfoDB.getPharmacyById(payload.from_pharm_id).catch(()=>null);
        if (!p) throw new Error("Invalid from_pharm_id");
    }
    if (payload.to_pharm_id) {
        const p = await pharmInfoDB.getPharmacyById(payload.to_pharm_id).catch(()=>null);
        if (!p) throw new Error("Invalid to_pharm_id");
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

// Helper to enrich a single exchange record with related entities
const enrichExchange = async (exchange) => {
    const [fromPharm, toPharm, medication, inventory, warehouse] = await Promise.all([
        pharmInfoDB.getPharmacyById(exchange.from_pharm_id),
        pharmInfoDB.getPharmacyById(exchange.to_pharm_id),
        medicationDB.getMedicationById(exchange.medication_id),
        pharmInventoryDB.getPharmInventoryById(exchange.inventory_id),
        warehouseDB.getWarehouseById(exchange.warehouse_id),
    ]);
    return {
        ...exchange,
        from_pharm: fromPharm,
        to_pharm: toPharm,
        medication,
        inventory,
        warehouse,
    };
};

// GET single
export const getExchangeById = async (req, res) => {
    try {
        const exchange = await exchangePharmDB.getExchangeById(req.params.id);
        const enriched = await enrichExchange(exchange);
        res.status(200).json(enriched);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET all exchanges or filtered by ids
export const getExchangesByQuery = async (req, res) => {
    try {
        const ids = parseIds(req);
        const filters = parseFilters(req, allowedFilters);
        if (ids) {
            const exchanges = await exchangePharmDB.getExchangesByIds(ids, filters);
            const enriched = await Promise.all(exchanges.map(enrichExchange));
            return res.status(200).json(enriched);
        }
        // No ID – return all enriched
        const all = await exchangePharmDB.getAllExchanges(filters);
        const enrichedAll = await Promise.all(all.map(enrichExchange));
        res.status(200).json(enrichedAll);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// INSERT new exchange
export const insertExchange = async (req, res) => {
    try {
        await validateFKs(req.body);
        const data = await exchangePharmDB.insertExchange(req.body);
        const enriched = await enrichExchange(data);
        res.status(201).json(enriched);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PATCH update identified by request_id
export const patchExchange = async (req, res) => {
    try {
        const requestId = req.params.id;
        const updates = { ...req.body };

        await validateFKs(updates);
        const updated = await exchangePharmDB.updateExchange(requestId, updates);
        const enriched = await enrichExchange(updated);
        res.status(200).json(enriched);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE single by ID
export const deleteExchangeById = async (req, res) => {
    try {
        const data = await exchangePharmDB.deleteExchange(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE multiple exchanges via query params
export const deleteExchangesByQuery = async (req, res) => {
    try {
        const ids = parseIds(req);
        if (ids) {
            const results = await Promise.all(ids.map((singleId) => exchangePharmDB.deleteExchange(singleId)));
            return res.status(200).json({ deletedIds: ids, results });
        }
        res.status(400).json({ message: "Missing ids query parameter for bulk delete." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
