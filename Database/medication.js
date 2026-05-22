import { supabase } from "./supabase.js";

// Get all
export const getAllMedications = async () => {
    const { data, error } = await supabase.from("t_medication").select("*");
    if (error) throw error;
    return data;
};

// Get by ID
export const getMedicationById = async (id) => {
    const { data, error } = await supabase.from("t_medication").select("*").eq("medication_id", id).single();
    if (error) throw error;
    return data;
};

// Insert
export const insertMedication = async (item) => {
    const { data, error } = await supabase.from("t_medication").insert([item]).select().single();
    if (error) throw error;
    return data;
};

// Update
export const updateMedication = async (id, updates) => {
    const { data, error } = await supabase.from("t_medication").update(updates).eq("medication_id", id).select().single();
    if (error) throw error;
    return data;
};

// Delete
export const deleteMedication = async (id) => {
    const { data, error } = await supabase.from("t_medication").delete().eq("medication_id", id);
    if (error) throw error;
    return data;
};
