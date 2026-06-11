import * as ordersDB from "../../database/orders.js";
import * as clientDB from "../../database/dbclient.js";
import * as pharmInfoDB from "../../database/pharmInfo.js";
import { parseIds, parseFilters } from "../../utils/queryParser.js";
import { sendEvent, TOPICS } from "../../kafka/producer.js";

const allowedFilters = ['order_id', 'client_id', 'pharm_id', 'status', 'order_date'];

const STATUS_EVENT = {
    Completed: 'ORDER_COMPLETED',
    Pending:   'ORDER_PENDING',
    Cancelled: 'ORDER_CANCELLED',
};

const enrichOrder = async (item) => {
    const [client, pharmacy] = await Promise.all([
        item.client_id ? clientDB.getClientById(item.client_id).catch(()=>null) : null,
        item.pharm_id ? pharmInfoDB.getPharmacyById(item.pharm_id).catch(()=>null) : null
    ]);
    return { ...item, client, pharmacy };
};

const validateFKs = async (payload) => {
    if (payload.client_id) {
        const c = await clientDB.getClientById(payload.client_id).catch(()=>null);
        if (!c) throw new Error("Invalid client_id");
    }
    if (payload.pharm_id) {
        const p = await pharmInfoDB.getPharmacyById(payload.pharm_id).catch(()=>null);
        if (!p) throw new Error("Invalid pharm_id");
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const ids = parseIds(req);
        const filters = parseFilters(req, allowedFilters);
        const rawData = ids ? await ordersDB.getOrdersByIds(ids, filters) : await ordersDB.getAllOrders(filters);
        const data = await Promise.all(rawData.map(enrichOrder));
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const rawData = await ordersDB.getOrderById(req.params.id);
        const data = await enrichOrder(rawData);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const insertOrder = async (req, res) => {
    try {
        await validateFKs(req.body);
        const data = await ordersDB.insertOrder(req.body);
        await sendEvent(TOPICS.ORDERS, STATUS_EVENT[data.status] || 'ORDER_UPDATED', data.pharm_id, {
            order_id:   data.order_id,
            client_id:  data.client_id,
            pharm_id:   data.pharm_id,
            pharm_name: data.pharm_name ?? null,
            order_date: data.order_date ?? null,
            status:     data.status,
        });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateOrder = async (req, res) => {
    try {
        await validateFKs(req.body);
        const data = await ordersDB.updateOrder(req.params.id, req.body);
        await sendEvent(TOPICS.ORDERS, STATUS_EVENT[data.status] || 'ORDER_UPDATED', data.pharm_id, {
            order_id:   data.order_id,
            client_id:  data.client_id,
            pharm_id:   data.pharm_id,
            pharm_name: data.pharm_name ?? null,
            order_date: data.order_date ?? null,
            status:     data.status,
        });
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const ids = parseIds(req);
        if (ids) {
            const data = await ordersDB.deleteOrdersByIds(ids);
            return res.status(200).json({ deletedIds: ids, result: data });
        }
        const data = await ordersDB.deleteOrder(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
