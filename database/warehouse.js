import { supabase } from "./supabase.js";

// Get all
export const getAllWarehouses = async () => {
    const { data, error } = await supabase.from("t_warehouse").select("*");
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
