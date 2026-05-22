import { supabase } from "./supabase.js";

// Get all
export const getAllWarehouseInventory = async () => {
    const { data, error } = await supabase.from("t_warehouse_inventory").select("*");
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
