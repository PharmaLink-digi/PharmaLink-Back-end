import { supabase } from "../../database/supabase.js";
import { ApiError } from "../../utils/ApiError.js";

export const getAllClients = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("t_client")
    .select("client_id, client_name, phone, email", { count: "exact" })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return { clients: data, total: count, page, limit };
};

export const getClientById = async (id) => {
  const { data, error } = await supabase
    .from("t_client")
    .select("client_id, client_name, phone, email")
    .eq("client_id", id)
    .single();

  if (error || !data) {
    throw new ApiError(404, "Client not found");
  }

  return data;
};

export const updateClient = async (id, updateData) => {
  const { data, error } = await supabase
    .from("t_client")
    .update(updateData)
    .eq("client_id", id)
    .select("client_id, client_name, phone, email")
    .single();

  if (error || !data) {
    throw new ApiError(404, "Client not found or could not be updated");
  }

  return data;
};

export const deleteClient = async (id) => {
  // Soft delete logic can be added here if there's an is_deleted field
  const { error } = await supabase
    .from("t_client")
    .delete()
    .eq("client_id", id);

  if (error) {
    throw new ApiError(400, "Could not delete client");
  }

  return true;
};
