import * as warehouseDB from "../../database/warehouse.js";
import { parseIds, parseFilters } from "../../utils/queryParser.js";

const allowedFilters = ['warehouse_id', 'warehouse_code', 'area', 'phone'];

export const getAllWarehouses = async (req, res) => {
    try {
        const ids = parseIds(req);
        const filters = parseFilters(req, allowedFilters);
        const data = ids ? await warehouseDB.getWarehousesByIds(ids, filters) : await warehouseDB.getAllWarehouses(filters);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getWarehouseById = async (req, res) => {
    try {
        const data = await warehouseDB.getWarehouseById(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const insertWarehouse = async (req, res) => {
    try {
        const data = await warehouseDB.insertWarehouse(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateWarehouse = async (req, res) => {
    try {
        const data = await warehouseDB.updateWarehouse(req.params.id, req.body);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteWarehouse = async (req, res) => {
    try {
        const ids = parseIds(req);
        if (ids) {
            const data = await warehouseDB.deleteWarehousesByIds(ids);
            return res.status(200).json({ deletedIds: ids, result: data });
        }
        const data = await warehouseDB.deleteWarehouse(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
