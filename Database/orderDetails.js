import { supabase } from "./supabase.js";

// Get all
export const getAllOrderDetails = async () => {
    const { data, error } = await supabase.from("t_order_details").select("*");
    if (error) throw error;
    return data;
};

// Get by ID
export const getOrderDetailById = async (id) => {
    const { data, error } = await supabase.from("t_order_details").select("*").eq("order_detail_id", id).single();
    if (error) throw error;
    return data;
};

// Insert
export const insertOrderDetail = async (item) => {
    const { data, error } = await supabase.from("t_order_details").insert([item]).select().single();
    if (error) throw error;
    return data;
};

// Update
export const updateOrderDetail = async (id, updates) => {
    const { data, error } = await supabase.from("t_order_details").update(updates).eq("order_detail_id", id).select().single();
    if (error) throw error;
    return data;
};

// Delete
export const deleteOrderDetail = async (id) => {
    const { data, error } = await supabase.from("t_order_details").delete().eq("order_detail_id", id);
    if (error) throw error;
    return data;
};
