import { supabase } from "./supabase.js";

// Helper to apply filters
const applyFilters = (query, filters) => {
    if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
            query = query.eq(key, val);
        });
    }
    return query;
};


// Get all
export const getAllWarehouseInventory = async (filters = {}) => {
    let query = supabase.from("t_warehouse_inventory").select("*");
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

// Get by ID
export const getWarehouseInventoryById = async (id) => {
    const { data, error } = await supabase.from("t_warehouse_inventory").select("*").eq("w_inventory_id", id).single();
    if (error) throw error;
    return data;
};

// Insert
export const insertWarehouseInventory = async (item) => {
    const { data, error } = await supabase.from("t_warehouse_inventory").insert([item]).select().single();
    if (error) throw error;
    return data;
};

// Update
export const updateWarehouseInventory = async (id, updates) => {
    const { data, error } = await supabase.from("t_warehouse_inventory").update(updates).eq("w_inventory_id", id).select().single();
    if (error) throw error;
    return data;
};

// Delete
export const deleteWarehouseInventory = async (id) => {
    const { data, error } = await supabase.from("t_warehouse_inventory").delete().eq("w_inventory_id", id);
    if (error) throw error;
    return data;
};
export const getWarehouseInventoriesByIds = async (ids, filters = {}) => {
    let query = supabase.from("t_warehouse_inventory").select("*").in('w_inventory_id', ids);
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const deleteWarehouseInventoriesByIds = async (ids) => {
    const { data, error } = await supabase.from("t_warehouse_inventory").delete().in('w_inventory_id', ids);
    if (error) throw error;
    return data;
};
