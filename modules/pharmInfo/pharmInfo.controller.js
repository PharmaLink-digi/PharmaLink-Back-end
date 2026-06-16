import * as pharmInfoDB from "../../database/pharmInfo.js";
import { parseIds, parseFilters } from "../../utils/queryParser.js";

const allowedFilters = ['pharm_id', 'pharm_name', 'area', 'phone'];

export const getAllPharmacies = async (req, res) => {
    try {
        const ids = parseIds(req);
        const filters = parseFilters(req, allowedFilters);
        const data = ids ? await pharmInfoDB.getPharmaciesByIds(ids, filters) : await pharmInfoDB.getAllPharmacies(filters);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getPharmacyById = async (req, res) => {
    try {
        const data = await pharmInfoDB.getPharmacyById(req.params.id);
        if (!data) return res.status(404).json({ message: `Pharmacy ${req.params.id} not found` });
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const insertPharmacy = async (req, res) => {
    try {
        const data = await pharmInfoDB.insertPharmacy(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updatePharmacy = async (req, res) => {
    try {
        const data = await pharmInfoDB.updatePharmacy(req.params.id, req.body);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deletePharmacy = async (req, res) => {
    try {
        const ids = parseIds(req);
        if (ids) {
            const data = await pharmInfoDB.deletePharmaciesByIds(ids);
            return res.status(200).json({ deletedIds: ids, result: data });
        }
        const data = await pharmInfoDB.deletePharmacy(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
