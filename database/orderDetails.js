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
export const getAllOrderDetails = async (filters = {}) => {
    let query = supabase.from("t_order_details").select("*");
    query = applyFilters(query, filters);
    const { data, error } = await query;
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
export const getOrderDetailsByIds = async (ids, filters = {}) => {
    let query = supabase.from("t_order_details").select("*").in('order_detail_id', ids);
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const deleteOrderDetailsByIds = async (ids) => {
    const { data, error } = await supabase.from("t_order_details").delete().in('order_detail_id', ids);
    if (error) throw error;
    return data;
};
