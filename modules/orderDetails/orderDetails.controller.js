import * as orderDetailsDB from "../../database/orderDetails.js";

export const getAllOrderDetails = async (req, res) => {
    try {
        const data = await orderDetailsDB.getAllOrderDetails();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getOrderDetailById = async (req, res) => {
    try {
        const data = await orderDetailsDB.getOrderDetailById(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const insertOrderDetail = async (req, res) => {
    try {
        const data = await orderDetailsDB.insertOrderDetail(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateOrderDetail = async (req, res) => {
    try {
        const data = await orderDetailsDB.updateOrderDetail(req.params.id, req.body);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteOrderDetail = async (req, res) => {
    try {
        const data = await orderDetailsDB.deleteOrderDetail(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
