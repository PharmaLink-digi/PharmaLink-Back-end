import fs from 'fs';
import path from 'path';

const filePath = path.resolve('./modules/exchangePharm/exchangePharm.controller.js');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add parseFilters and allowedFilters
content = content.replace(
    'import { parseIds } from "../../utils/queryParser.js";',
    `import { parseIds, parseFilters } from "../../utils/queryParser.js";

const allowedFilters = ['request_id', 'from_pharm_id', 'to_pharm_id', 'inventory_id', 'warehouse_id', 'medication_id', 'status'];

// Helper for validation
const validateFKs = async (payload) => {
    if (payload.from_pharm_id) {
        const p = await pharmInfoDB.getPharmacyById(payload.from_pharm_id).catch(()=>null);
        if (!p) throw new Error("Invalid from_pharm_id");
    }
    if (payload.to_pharm_id) {
        const p = await pharmInfoDB.getPharmacyById(payload.to_pharm_id).catch(()=>null);
        if (!p) throw new Error("Invalid to_pharm_id");
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

// 2. Patch getExchangesByQuery to apply filters
content = content.replace(
    /export const getExchangesByQuery = async \(req, res\) => {([\s\S]*?)const ids = parseIds\(req\);([\s\S]*?)const exchanges = await exchangePharmDB\.getExchangesByIds\(ids\);([\s\S]*?)const all = await exchangePharmDB\.getAllExchanges\(\);/m,
    `export const getExchangesByQuery = async (req, res) => {$1const ids = parseIds(req);
        const filters = parseFilters(req.query, allowedFilters);$2const exchanges = await exchangePharmDB.getExchangesByIds(ids, filters);$3const all = await exchangePharmDB.getAllExchanges(filters);`
);

// 3. Patch insertExchange to validate FKs
content = content.replace(
    /export const insertExchange = async \(req, res\) => {([\s\S]*?)const data = await exchangePharmDB\.insertExchange\(req\.body\);/m,
    `export const insertExchange = async (req, res) => {$1await validateFKs(req.body);
        const data = await exchangePharmDB.insertExchange(req.body);`
);

// 4. Patch patchExchange to use new validateFKs instead of the old manual one
content = content.replace(
    /        \/\/ Validate existence of both pharmacies if they are included in updates([\s\S]*?)        const updated = await exchangePharmDB\.updateExchange\(requestId, updates\);/m,
    `        await validateFKs(updates);
        const updated = await exchangePharmDB.updateExchange(requestId, updates);`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Patched exchangePharm.controller.js");
