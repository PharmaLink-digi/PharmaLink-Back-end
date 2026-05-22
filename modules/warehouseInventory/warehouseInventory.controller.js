import * as warehouseInventoryDB from "../../database/warehouseInventory.js";

export const getAllWarehouseInventory = async (req, res) => {
    try {
        const data = await warehouseInventoryDB.getAllWarehouseInventory();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getWarehouseInventoryById = async (req, res) => {
    try {
        const data = await warehouseInventoryDB.getWarehouseInventoryById(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const insertWarehouseInventory = async (req, res) => {
    try {
        const data = await warehouseInventoryDB.insertWarehouseInventory(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateWarehouseInventory = async (req, res) => {
    try {
        const data = await warehouseInventoryDB.updateWarehouseInventory(req.params.id, req.body);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteWarehouseInventory = async (req, res) => {
    try {
        const data = await warehouseInventoryDB.deleteWarehouseInventory(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
