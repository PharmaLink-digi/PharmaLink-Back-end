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
export const getAllExchanges = async (filters = {}) => {
    let query = supabase.from("t_exchange_pharm").select("*");
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

// Get by ID
export const getExchangeById = async (id) => {
    const { data, error } = await supabase.from("t_exchange_pharm").select("*").eq("request_id", id).single();
    if (error) throw error;
    return data;
};

// Insert
export const insertExchange = async (item) => {
    const { data, error } = await supabase.from("t_exchange_pharm").insert([item]).select().single();
    if (error) throw error;
    return data;
};

// Update
export const updateExchange = async (id, updates) => {
    const { data, error } = await supabase.from("t_exchange_pharm").update(updates).eq("request_id", id).select().single();
    if (error) throw error;
    return data;
};

// Delete
export const deleteExchange = async (id) => {
    const { data, error } = await supabase.from("t_exchange_pharm").delete().eq("request_id", id);
    if (error) throw error;
    return data;
};

export const getExchangesByIds = async (ids, filters = {}) => {
    let query = supabase.from("t_exchange_pharm").select("*").in('request_id', ids);
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const updateExchangeByPharms = async (fromId, toId, updates) => {
    const { data, error } = await supabase.from("t_exchange_pharm").update(updates).eq("from_pharm_id", fromId).eq("to_pharm_id", toId).select().single();
    if (error) throw error;
    return data;
};
