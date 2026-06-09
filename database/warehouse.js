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
export const getAllWarehouses = async (filters = {}) => {
    let query = supabase.from("t_warehouse").select("*");
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

// Get by ID
export const getWarehouseById = async (id) => {
    const { data, error } = await supabase.from("t_warehouse").select("*").eq("warehouse_id", id).single();
    if (error) throw error;
    return data;
};

// Insert
export const insertWarehouse = async (item) => {
    const { data, error } = await supabase.from("t_warehouse").insert([item]).select().single();
    if (error) throw error;
    return data;
};

// Update
export const updateWarehouse = async (id, updates) => {
    const { data, error } = await supabase.from("t_warehouse").update(updates).eq("warehouse_id", id).select().single();
    if (error) throw error;
    return data;
};

// Delete
export const deleteWarehouse = async (id) => {
    const { data, error } = await supabase.from("t_warehouse").delete().eq("warehouse_id", id);
    if (error) throw error;
    return data;
};
export const getWarehousesByIds = async (ids, filters = {}) => {
    let query = supabase.from("t_warehouse").select("*").in('warehouse_id', ids);
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const deleteWarehousesByIds = async (ids) => {
    const { data, error } = await supabase.from("t_warehouse").delete().in('warehouse_id', ids);
    if (error) throw error;
    return data;
};
