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
export const getAllSales = async (filters = {}) => {
    let query = supabase.from("sales").select("*");
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

// Get by ID
export const getSaleById = async (id) => {
    const { data, error } = await supabase.from("sales").select("*").eq("sale_id", id).single();
    if (error) throw error;
    return data;
};

// Insert
export const insertSale = async (item) => {
    const { data, error } = await supabase.from("sales").insert([item]).select().single();
    if (error) throw error;
    return data;
};

// Update
export const updateSale = async (id, updates) => {
    const { data, error } = await supabase.from("sales").update(updates).eq("sale_id", id).select().single();
    if (error) throw error;
    return data;
};

// Delete
export const deleteSale = async (id) => {
    const { data, error } = await supabase.from("sales").delete().eq("sale_id", id);
    if (error) throw error;
    return data;
};
export const getSalesByIds = async (ids, filters = {}) => {
    let query = supabase.from("sales").select("*").in('sale_id', ids);
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const deleteSalesByIds = async (ids) => {
    const { data, error } = await supabase.from("sales").delete().in('sale_id', ids);
    if (error) throw error;
    return data;
};
