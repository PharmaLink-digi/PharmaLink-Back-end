import fs from 'fs';
import path from 'path';

const filePath = path.resolve('./modules/orders/orders.controller.js');
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(
    'import * as ordersDB from "../../database/orders.js";\nimport { parseIds } from "../../utils/queryParser.js";',
    `import * as ordersDB from "../../database/orders.js";
import * as clientDB from "../../database/dbclient.js";
import * as pharmInfoDB from "../../database/pharmInfo.js";
import { parseIds, parseFilters } from "../../utils/queryParser.js";

const allowedFilters = ['order_id', 'client_id', 'pharm_id', 'status', 'order_date'];

// Helper for enrichment
const enrichOrder = async (item) => {
    const [client, pharmacy] = await Promise.all([
        item.client_id ? clientDB.getClientById(item.client_id).catch(()=>null) : null,
        item.pharm_id ? pharmInfoDB.getPharmacyById(item.pharm_id).catch(()=>null) : null
    ]);
    return { ...item, client, pharmacy };
};

// Helper for validation
const validateFKs = async (payload) => {
    if (payload.client_id) {
        const c = await clientDB.getClientById(payload.client_id).catch(()=>null);
        if (!c) throw new Error("Invalid client_id");
    }
    if (payload.pharm_id) {
        const p = await pharmInfoDB.getPharmacyById(payload.pharm_id).catch(()=>null);
        if (!p) throw new Error("Invalid pharm_id");
    }
};`
);

content = content.replace(
    /export const getAllOrders = async \(req, res\) => {([\s\S]*?)const ids = parseIds\(req\);([\s\S]*?)const data = ids \? await ordersDB\.getOrdersByIds\(ids\) : await ordersDB\.getAllOrders\(\);([\s\S]*?)res\.status\(200\)\.json\(data\);/m,
    `export const getAllOrders = async (req, res) => {$1const ids = parseIds(req);
        const filters = parseFilters(req.query, allowedFilters);$2const rawData = ids ? await ordersDB.getOrdersByIds(ids, filters) : await ordersDB.getAllOrders(filters);
        const data = await Promise.all(rawData.map(enrichOrder));$3res.status(200).json(data);`
);

content = content.replace(
    /export const getOrderById = async \(req, res\) => {([\s\S]*?)const data = await ordersDB\.getOrderById\(req\.params\.id\);([\s\S]*?)res\.status\(200\)\.json\(data\);/m,
    `export const getOrderById = async (req, res) => {$1const rawData = await ordersDB.getOrderById(req.params.id);
        const data = await enrichOrder(rawData);$2res.status(200).json(data);`
);

content = content.replace(
    /export const insertOrder = async \(req, res\) => {([\s\S]*?)const data = await ordersDB\.insertOrder\(req\.body\);/m,
    `export const insertOrder = async (req, res) => {$1await validateFKs(req.body);
        const data = await ordersDB.insertOrder(req.body);`
);

content = content.replace(
    /export const updateOrder = async \(req, res\) => {([\s\S]*?)const data = await ordersDB\.updateOrder\(req\.params\.id, req\.body\);/m,
    `export const updateOrder = async (req, res) => {$1await validateFKs(req.body);
        const data = await ordersDB.updateOrder(req.params.id, req.body);`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Patched orders.controller.js");
