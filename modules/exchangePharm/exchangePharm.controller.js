import * as exchangePharmDB from "../../database/exchangePharm.js";

export const getAllExchanges = async (req, res) => {
    try {
        const data = await exchangePharmDB.getAllExchanges();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getExchangeById = async (req, res) => {
    try {
        const data = await exchangePharmDB.getExchangeById(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const insertExchange = async (req, res) => {
    try {
        const data = await exchangePharmDB.insertExchange(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateExchange = async (req, res) => {
    try {
        const data = await exchangePharmDB.updateExchange(req.params.id, req.body);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteExchange = async (req, res) => {
    try {
        const data = await exchangePharmDB.deleteExchange(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
