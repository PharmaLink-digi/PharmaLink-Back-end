import fs from 'fs';
import path from 'path';

const filePath = path.resolve('./modules/warehouseInventory/warehouseInventory.controller.js');
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(
    'import * as warehouseInventoryDB from "../../database/warehouseInventory.js";\nimport { parseIds } from "../../utils/queryParser.js";',
    `import * as warehouseInventoryDB from "../../database/warehouseInventory.js";
import * as warehouseDB from "../../database/warehouse.js";
import * as medicationDB from "../../database/medication.js";
import { parseIds, parseFilters } from "../../utils/queryParser.js";

const allowedFilters = ['w_inventory_id', 'warehouse_id', 'medication_id', 'category'];

// Helper for enrichment
const enrichWarehouseInventory = async (item) => {
    const [warehouse, medication] = await Promise.all([
        item.warehouse_id ? warehouseDB.getWarehouseById(item.warehouse_id).catch(()=>null) : null,
        item.medication_id ? medicationDB.getMedicationById(item.medication_id).catch(()=>null) : null
    ]);
    return { ...item, warehouse, medication };
};

// Helper for validation
const validateFKs = async (payload) => {
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
    /export const getAllWarehouseInventory = async \(req, res\) => {([\s\S]*?)const ids = parseIds\(req\);([\s\S]*?)const data = ids \? await warehouseInventoryDB\.getWarehouseInventoriesByIds\(ids\) : await warehouseInventoryDB\.getAllWarehouseInventory\(\);([\s\S]*?)res\.status\(200\)\.json\(data\);/m,
    `export const getAllWarehouseInventory = async (req, res) => {$1const ids = parseIds(req);
        const filters = parseFilters(req.query, allowedFilters);$2const rawData = ids ? await warehouseInventoryDB.getWarehouseInventoriesByIds(ids, filters) : await warehouseInventoryDB.getAllWarehouseInventory(filters);
        const data = await Promise.all(rawData.map(enrichWarehouseInventory));$3res.status(200).json(data);`
);

content = content.replace(
    /export const getWarehouseInventoryById = async \(req, res\) => {([\s\S]*?)const data = await warehouseInventoryDB\.getWarehouseInventoryById\(req\.params\.id\);([\s\S]*?)res\.status\(200\)\.json\(data\);/m,
    `export const getWarehouseInventoryById = async (req, res) => {$1const rawData = await warehouseInventoryDB.getWarehouseInventoryById(req.params.id);
        const data = await enrichWarehouseInventory(rawData);$2res.status(200).json(data);`
);

content = content.replace(
    /export const insertWarehouseInventory = async \(req, res\) => {([\s\S]*?)const data = await warehouseInventoryDB\.insertWarehouseInventory\(req\.body\);/m,
    `export const insertWarehouseInventory = async (req, res) => {$1await validateFKs(req.body);
        const data = await warehouseInventoryDB.insertWarehouseInventory(req.body);`
);

content = content.replace(
    /export const updateWarehouseInventory = async \(req, res\) => {([\s\S]*?)const data = await warehouseInventoryDB\.updateWarehouseInventory\(req\.params\.id, req\.body\);/m,
    `export const updateWarehouseInventory = async (req, res) => {$1await validateFKs(req.body);
        const data = await warehouseInventoryDB.updateWarehouseInventory(req.params.id, req.body);`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Patched warehouseInventory.controller.js");
