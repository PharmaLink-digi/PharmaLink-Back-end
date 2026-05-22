import { supabase } from "./supabase.js";

// Get all
export const getAllPharmacies = async () => {
    const { data, error } = await supabase.from("t_pharm_info").select("*");
    if (error) throw error;
    return data;
};

// Get by ID
export const getPharmacyById = async (id) => {
    const { data, error } = await supabase.from("t_pharm_info").select("*").eq("pharm_id", id).single();
    if (error) throw error;
    return data;
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
