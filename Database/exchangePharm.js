import { supabase } from "./supabase.js";

// Get all
export const getAllExchanges = async () => {
    const { data, error } = await supabase.from("t_exchange_pharm").select("*");
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
