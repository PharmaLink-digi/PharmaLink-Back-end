import * as clientDB from "../../database/dbclient.js";

export const getAllClients = async (req, res) => {
    try {
        const data = await clientDB.getAllClients();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getClientById = async (req, res) => {
    try {
        const data = await clientDB.getClientById(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const insertClient = async (req, res) => {
    try {
        const data = await clientDB.insertClient(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateClient = async (req, res) => {
    try {
        const data = await clientDB.updateClient(req.params.id, req.body);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteClient = async (req, res) => {
    try {
        const data = await clientDB.deleteClient(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
