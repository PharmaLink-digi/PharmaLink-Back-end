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
export const getAllPharmacies = async (filters = {}) => {
    let query = supabase.from("t_pharm_info").select("*");
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

// Get by ID
export const getPharmacyById = async (id) => {
    const { data, error } = await supabase.from("t_pharm_info").select("*").eq("pharm_id", id).maybeSingle();
    if (error) throw error;
    return data; // null when not found — controller sends 404
};

// Insert
export const insertPharmacy = async (item) => {
    const { data, error } = await supabase.from("t_pharm_info").insert([item]).select().single();
    if (error) throw error;
    return data;
};

// Update
export const updatePharmacy = async (id, updates) => {
    const { data, error } = await supabase.from("t_pharm_info").update(updates).eq("pharm_id", id).select().single();
    if (error) throw error;
    return data;
};

// Delete
export const deletePharmacy = async (id) => {
    const { data, error } = await supabase.from("t_pharm_info").delete().eq("pharm_id", id);
    if (error) throw error;
    return data;
};
