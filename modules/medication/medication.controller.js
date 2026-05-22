import * as medicationDB from "../../database/medication.js";

export const getAllMedications = async (req, res) => {
    try {
        const data = await medicationDB.getAllMedications();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getMedicationById = async (req, res) => {
    try {
        const data = await medicationDB.getMedicationById(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const insertMedication = async (req, res) => {
    try {
        const data = await medicationDB.insertMedication(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateMedication = async (req, res) => {
    try {
        const data = await medicationDB.updateMedication(req.params.id, req.body);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteMedication = async (req, res) => {
    try {
        const data = await medicationDB.deleteMedication(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
