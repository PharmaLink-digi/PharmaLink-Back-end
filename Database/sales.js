import { supabase } from "./supabase.js";

// Get all
export const getAllSales = async () => {
    const { data, error } = await supabase.from("sales").select("*");
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
