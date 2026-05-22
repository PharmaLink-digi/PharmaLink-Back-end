import { supabase } from "./supabase.js";

// Get all
export const getAllClients = async () => {
    const { data, error } = await supabase.from("t_clients").select("*");
    if (error) throw error;
    return data;
};

// Get by ID
export const getClientById = async (id) => {
    const { data, error } = await supabase.from("t_clients").select("*").eq("client_id", id).single();
    if (error) throw error;
    return data;
};

// Insert
export const insertClient = async (item) => {
    const { data, error } = await supabase.from("t_clients").insert([item]).select().single();
    if (error) throw error;
    return data;
};

// Update
export const updateClient = async (id, updates) => {
    const { data, error } = await supabase.from("t_clients").update(updates).eq("client_id", id).select().single();
    if (error) throw error;
    return data;
};

// Delete
export const deleteClient = async (id) => {
    const { data, error } = await supabase.from("t_clients").delete().eq("client_id", id);
    if (error) throw error;
    return data;
};
