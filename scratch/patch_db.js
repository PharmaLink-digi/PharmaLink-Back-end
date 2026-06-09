import fs from 'fs';
import path from 'path';

const dbDir = path.resolve('./database');
const files = fs.readdirSync(dbDir).filter(f => f.endsWith('.js') && f !== 'supabase.js' && f !== 'exchangePharm.js');

const applyFiltersCode = `
// Helper to apply filters
const applyFilters = (query, filters) => {
    if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
            query = query.eq(key, val);
        });
    }
    return query;
};
`;

for (const file of files) {
    const filePath = path.join(dbDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    if (content.includes('applyFilters')) continue;

    // insert applyFilters after supabase import
    content = content.replace('import { supabase } from "./supabase.js";', 'import { supabase } from "./supabase.js";\n' + applyFiltersCode);

    // patch getAll
    content = content.replace(
        /export const getAll([A-Za-z]+) = async \(\) => {([\s\S]*?)const { data([^,}]*?), error([^}]*?) } = await supabase\.from\("([^"]+)"\)\.select\("([^"]+)"\);([\s\S]*?)if \(error/m,
        (match, name, before, dataAlias, errorAlias, table, selectFields, after) => {
            return `export const getAll${name} = async (filters = {}) => {${before}let query = supabase.from("${table}").select("${selectFields}");\n    query = applyFilters(query, filters);\n    const { data${dataAlias}, error${errorAlias} } = await query;${after}if (error`;
        }
    );

    // patch getByIds
    content = content.replace(
        /export const get([A-Za-z]+)ByIds = async \(ids\) => {([\s\S]*?)const { data([^,}]*?), error([^}]*?) } = await supabase\.from\("([^"]+)"\)\.select\("\*"\)\.in\('([^']+)', ids\);([\s\S]*?)if \(error/m,
        (match, name, before, dataAlias, errorAlias, table, idField, after) => {
            return `export const get${name}ByIds = async (ids, filters = {}) => {${before}let query = supabase.from("${table}").select("*").in('${idField}', ids);\n    query = applyFilters(query, filters);\n    const { data${dataAlias}, error${errorAlias} } = await query;${after}if (error`;
        }
    );

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Patched ${file}`);
}
