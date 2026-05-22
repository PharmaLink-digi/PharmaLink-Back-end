import { supabase } from "./supabase.js";

// Get all
export const getAllOrders = async () => {
    const { data, error } = await supabase.from("t_orders").select("*");
    if (error) throw error;
    return data;
};

// Get by ID
export const getOrderById = async (id) => {
    const { data, error } = await supabase.from("t_orders").select("*").eq("order_id", id).single();
    if (error) throw error;
    return data;
};

// Insert
export const insertOrder = async (item) => {
    const { data, error } = await supabase.from("t_orders").insert([item]).select().single();
    if (error) throw error;
    return data;
};

// Update
export const updateOrder = async (id, updates) => {
    const { data, error } = await supabase.from("t_orders").update(updates).eq("order_id", id).select().single();
    if (error) throw error;
    return data;
};

// Delete
export const deleteOrder = async (id) => {
    const { data, error } = await supabase.from("t_orders").delete().eq("order_id", id);
    if (error) throw error;
    return data;
};
