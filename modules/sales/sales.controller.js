import * as salesDB from "../../database/sales.js";

export const getAllSales = async (req, res) => {
    try {
        const data = await salesDB.getAllSales();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getSaleById = async (req, res) => {
    try {
        const data = await salesDB.getSaleById(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const insertSale = async (req, res) => {
    try {
        const data = await salesDB.insertSale(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateSale = async (req, res) => {
    try {
        const data = await salesDB.updateSale(req.params.id, req.body);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteSale = async (req, res) => {
    try {
        const data = await salesDB.deleteSale(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
