import * as warehouseDB from "../../database/warehouse.js";

export const getAllWarehouses = async (req, res) => {
    try {
        const data = await warehouseDB.getAllWarehouses();
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
        const data = await warehouseDB.deleteWarehouse(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
