import * as pharmInfoDB from "../../database/pharmInfo.js";

export const getAllPharmacies = async (req, res) => {
    try {
        const data = await pharmInfoDB.getAllPharmacies();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getPharmacyById = async (req, res) => {
    try {
        const data = await pharmInfoDB.getPharmacyById(req.params.id);
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
        const data = await pharmInfoDB.deletePharmacy(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
