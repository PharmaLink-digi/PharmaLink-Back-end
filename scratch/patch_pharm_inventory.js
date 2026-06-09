import fs from 'fs';
import path from 'path';

const filePath = path.resolve('./modules/pharmInventory/pharmInventory.controller.js');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add imports and allowedFilters
content = content.replace(
    'import * as pharmInventoryDB from "../../database/pharmInventory.js";\nimport { parseIds } from "../../utils/queryParser.js";',
    `import * as pharmInventoryDB from "../../database/pharmInventory.js";
import * as pharmInfoDB from "../../database/pharmInfo.js";
import * as warehouseDB from "../../database/warehouse.js";
import * as medicationDB from "../../database/medication.js";
import { parseIds, parseFilters } from "../../utils/queryParser.js";

const allowedFilters = ['inventory_id', 'pharm_id', 'warehouse_id', 'medication_id', 'category', 'movement_type', 'availability'];

// Helper for enrichment
const enrichPharmInventory = async (item) => {
    const [pharmacy, warehouse, medication] = await Promise.all([
        item.pharm_id ? pharmInfoDB.getPharmacyById(item.pharm_id).catch(()=>null) : null,
        item.warehouse_id ? warehouseDB.getWarehouseById(item.warehouse_id).catch(()=>null) : null,
        item.medication_id ? medicationDB.getMedicationById(item.medication_id).catch(()=>null) : null
    ]);
    return { ...item, pharmacy, warehouse, medication };
};

// Helper for validation
const validateFKs = async (payload) => {
    if (payload.pharm_id) {
        const p = await pharmInfoDB.getPharmacyById(payload.pharm_id).catch(()=>null);
        if (!p) throw new Error("Invalid pharm_id");
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

// 2. Patch getAll
content = content.replace(
    /export const getAllPharmInventory = async \(req, res\) => {([\s\S]*?)const ids = parseIds\(req\);([\s\S]*?)const data = ids \? await pharmInventoryDB\.getPharmInventoriesByIds\(ids\) : await pharmInventoryDB\.getAllPharmInventory\(\);([\s\S]*?)res\.status\(200\)\.json\(data\);/m,
    `export const getAllPharmInventory = async (req, res) => {$1const ids = parseIds(req);
        const filters = parseFilters(req, allowedFilters);$2const rawData = ids ? await pharmInventoryDB.getPharmInventoriesByIds(ids, filters) : await pharmInventoryDB.getAllPharmInventory(filters);
        const data = await Promise.all(rawData.map(enrichPharmInventory));$3res.status(200).json(data);`
);

// 3. Patch getById
content = content.replace(
    /export const getPharmInventoryById = async \(req, res\) => {([\s\S]*?)const data = await pharmInventoryDB\.getPharmInventoryById\(req\.params\.id\);([\s\S]*?)res\.status\(200\)\.json\(data\);/m,
    `export const getPharmInventoryById = async (req, res) => {$1const rawData = await pharmInventoryDB.getPharmInventoryById(req.params.id);
        const data = await enrichPharmInventory(rawData);$2res.status(200).json(data);`
);

// 4. Patch insert
content = content.replace(
    /export const insertPharmInventory = async \(req, res\) => {([\s\S]*?)const data = await pharmInventoryDB\.insertPharmInventory\(req\.body\);/m,
    `export const insertPharmInventory = async (req, res) => {$1await validateFKs(req.body);
        const data = await pharmInventoryDB.insertPharmInventory(req.body);`
);

// 5. Patch update
content = content.replace(
    /export const updatePharmInventory = async \(req, res\) => {([\s\S]*?)const data = await pharmInventoryDB\.updatePharmInventory\(req\.params\.id, req\.body\);/m,
    `export const updatePharmInventory = async (req, res) => {$1await validateFKs(req.body);
        const data = await pharmInventoryDB.updatePharmInventory(req.params.id, req.body);`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Patched pharmInventory.controller.js");
