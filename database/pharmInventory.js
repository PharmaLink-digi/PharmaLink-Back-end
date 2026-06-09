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
export const getAllPharmInventory = async (filters = {}) => {
    let query = supabase.from("t_pharm_inventory").select("*");
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

// Get by ID
export const getPharmInventoryById = async (id) => {
    const { data, error } = await supabase.from("t_pharm_inventory").select("*").eq("inventory_id", id).single();
    if (error) throw error;
    return data;
};

// Insert
export const insertPharmInventory = async (item) => {
    const { data, error } = await supabase.from("t_pharm_inventory").insert([item]).select().single();
    if (error) throw error;
    return data;
};

// Update
export const updatePharmInventory = async (id, updates) => {
    const { data, error } = await supabase.from("t_pharm_inventory").update(updates).eq("inventory_id", id).select().single();
    if (error) throw error;
    return data;
};

// Delete
export const deletePharmInventory = async (id) => {
    const { data, error } = await supabase.from("t_pharm_inventory").delete().eq("inventory_id", id);
    if (error) throw error;
    return data;
};
