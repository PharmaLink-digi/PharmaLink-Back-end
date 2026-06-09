import * as clientDB from "../../database/dbclient.js";
import { parseIds, parseFilters } from "../../utils/queryParser.js";

const allowedFilters = ['client_id', 'client_name', 'phone', 'email'];

export const getAllClients = async (req, res) => {
    try {
        const ids = parseIds(req);
        const filters = parseFilters(req, allowedFilters);
        const data = ids ? await clientDB.getClientsByIds(ids, filters) : await clientDB.getAllClients(filters);
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
        const ids = parseIds(req);
        if (ids) {
            const data = await clientDB.deleteClientsByIds(ids);
            return res.status(200).json({ deletedIds: ids, result: data });
        }
        const data = await clientDB.deleteClient(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
