import * as ordersDB from "../../database/orders.js";

export const getAllOrders = async (req, res) => {
    try {
        const data = await ordersDB.getAllOrders();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const data = await ordersDB.getOrderById(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const insertOrder = async (req, res) => {
    try {
        const data = await ordersDB.insertOrder(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateOrder = async (req, res) => {
    try {
        const data = await ordersDB.updateOrder(req.params.id, req.body);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const data = await ordersDB.deleteOrder(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
