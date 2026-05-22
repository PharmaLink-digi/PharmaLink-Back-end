import * as pharmInventoryDB from "../../database/pharmInventory.js";

export const getAllPharmInventory = async (req, res) => {
    try {
        const data = await pharmInventoryDB.getAllPharmInventory();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getPharmInventoryById = async (req, res) => {
    try {
        const data = await pharmInventoryDB.getPharmInventoryById(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const insertPharmInventory = async (req, res) => {
    try {
        const data = await pharmInventoryDB.insertPharmInventory(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updatePharmInventory = async (req, res) => {
    try {
        const data = await pharmInventoryDB.updatePharmInventory(req.params.id, req.body);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deletePharmInventory = async (req, res) => {
    try {
        const data = await pharmInventoryDB.deletePharmInventory(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
