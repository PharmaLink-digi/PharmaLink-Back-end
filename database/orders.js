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
export const getAllOrders = async (filters = {}) => {
    let query = supabase.from("t_orders").select("*");
    query = applyFilters(query, filters);
    const { data, error } = await query;
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
export const getOrdersByIds = async (ids, filters = {}) => {
    let query = supabase.from("t_orders").select("*").in('order_id', ids);
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const deleteOrdersByIds = async (ids) => {
    const { data, error } = await supabase.from("t_orders").delete().in('order_id', ids);
    if (error) throw error;
    return data;
};
