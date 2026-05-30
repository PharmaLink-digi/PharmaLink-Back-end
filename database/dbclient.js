import { supabase } from "./supabase.js";

// Get all
export const getAllClients = async () => {
    const { data, error } = await supabase.from("t_client").select("*");
    if (error) throw error;
    return data;
};

// Get by ID
export const getClientById = async (id) => {
    const { data, error } = await supabase.from("t_client").select("*").eq("client_id", id).single();
    if (error) throw error;
    return data;
};

// Get by Email
export const getClientByEmail = async (email) => {
    const { data, error } = await supabase.from("t_client").select("*").eq("email", email).maybeSingle();
    if (error) throw error;
    return data;
};

// Insert
export const insertClient = async (item) => {
    const { data, error } = await supabase.from("t_client").insert([item]).select().single();
    if (error) throw error;
    return data;
};

// Update
export const updateClient = async (id, updates) => {
    const { data, error } = await supabase.from("t_client").update(updates).eq("client_id", id).select().single();
    if (error) throw error;
    return data;
};

// Delete
export const deleteClient = async (id) => {
    const { data, error } = await supabase.from("t_client").delete().eq("client_id", id);
    if (error) throw error;
    return data;
};
