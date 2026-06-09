import fs from 'fs';
import path from 'path';

const filePath = path.resolve('./modules/orderDetails/orderDetails.controller.js');
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(
    'import * as orderDetailsDB from "../../database/orderDetails.js";\nimport { parseIds } from "../../utils/queryParser.js";',
    `import * as orderDetailsDB from "../../database/orderDetails.js";
import * as ordersDB from "../../database/orders.js";
import * as salesDB from "../../database/sales.js";
import * as clientDB from "../../database/dbclient.js";
import * as pharmInfoDB from "../../database/pharmInfo.js";
import * as pharmInventoryDB from "../../database/pharmInventory.js";
import * as warehouseDB from "../../database/warehouse.js";
import * as medicationDB from "../../database/medication.js";
import { parseIds, parseFilters } from "../../utils/queryParser.js";

const allowedFilters = ['order_detail_id', 'order_id', 'sale_id', 'client_id', 'pharm_id', 'inventory_id', 'warehouse_id', 'medication_id'];

// Helper for enrichment
const enrichOrderDetail = async (item) => {
    const [order, sale, client, pharmacy, inventory, warehouse, medication] = await Promise.all([
        item.order_id ? ordersDB.getOrderById(item.order_id).catch(()=>null) : null,
        item.sale_id ? salesDB.getSaleById(item.sale_id).catch(()=>null) : null,
        item.client_id ? clientDB.getClientById(item.client_id).catch(()=>null) : null,
        item.pharm_id ? pharmInfoDB.getPharmacyById(item.pharm_id).catch(()=>null) : null,
        item.inventory_id ? pharmInventoryDB.getPharmInventoryById(item.inventory_id).catch(()=>null) : null,
        item.warehouse_id ? warehouseDB.getWarehouseById(item.warehouse_id).catch(()=>null) : null,
        item.medication_id ? medicationDB.getMedicationById(item.medication_id).catch(()=>null) : null
    ]);
    return { ...item, order, sale, client, pharmacy, inventory, warehouse, medication };
};

// Helper for validation
const validateFKs = async (payload) => {
    if (payload.order_id) {
        const o = await ordersDB.getOrderById(payload.order_id).catch(()=>null);
        if (!o) throw new Error("Invalid order_id");
    }
    if (payload.sale_id) {
        const s = await salesDB.getSaleById(payload.sale_id).catch(()=>null);
        if (!s) throw new Error("Invalid sale_id");
    }
    if (payload.client_id) {
        const c = await clientDB.getClientById(payload.client_id).catch(()=>null);
        if (!c) throw new Error("Invalid client_id");
    }
    if (payload.pharm_id) {
        const p = await pharmInfoDB.getPharmacyById(payload.pharm_id).catch(()=>null);
        if (!p) throw new Error("Invalid pharm_id");
    }
    if (payload.inventory_id) {
        const i = await pharmInventoryDB.getPharmInventoryById(payload.inventory_id).catch(()=>null);
        if (!i) throw new Error("Invalid inventory_id");
    }
    if (payload.warehouse_id) {
        const w = await warehouseDB.getWarehouseById(payload.warehouse_id).catch(()=>null);
        if (!w) throw new Error("Invalid warehouse_id");
    }
    if (payload.medication_id) {
        const m = await medicationDB.getMedicationById(payload.medication_id).catch(()=>null);
        if (!m) throw new Error("Invalid medication_id");
    }
};`
);

content = content.replace(
    /export const getAllOrderDetails = async \(req, res\) => {([\s\S]*?)const ids = parseIds\(req\);([\s\S]*?)const data = ids \? await orderDetailsDB\.getOrderDetailsByIds\(ids\) : await orderDetailsDB\.getAllOrderDetails\(\);([\s\S]*?)res\.status\(200\)\.json\(data\);/m,
    `export const getAllOrderDetails = async (req, res) => {$1const ids = parseIds(req);
        const filters = parseFilters(req.query, allowedFilters);$2const rawData = ids ? await orderDetailsDB.getOrderDetailsByIds(ids, filters) : await orderDetailsDB.getAllOrderDetails(filters);
        const data = await Promise.all(rawData.map(enrichOrderDetail));$3res.status(200).json(data);`
);

content = content.replace(
    /export const getOrderDetailById = async \(req, res\) => {([\s\S]*?)const data = await orderDetailsDB\.getOrderDetailById\(req\.params\.id\);([\s\S]*?)res\.status\(200\)\.json\(data\);/m,
    `export const getOrderDetailById = async (req, res) => {$1const rawData = await orderDetailsDB.getOrderDetailById(req.params.id);
        const data = await enrichOrderDetail(rawData);$2res.status(200).json(data);`
);

content = content.replace(
    /export const insertOrderDetail = async \(req, res\) => {([\s\S]*?)const data = await orderDetailsDB\.insertOrderDetail\(req\.body\);/m,
    `export const insertOrderDetail = async (req, res) => {$1await validateFKs(req.body);
        const data = await orderDetailsDB.insertOrderDetail(req.body);`
);

content = content.replace(
    /export const updateOrderDetail = async \(req, res\) => {([\s\S]*?)const data = await orderDetailsDB\.updateOrderDetail\(req\.params\.id, req\.body\);/m,
    `export const updateOrderDetail = async (req, res) => {$1await validateFKs(req.body);
        const data = await orderDetailsDB.updateOrderDetail(req.params.id, req.body);`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Patched orderDetails.controller.js");
