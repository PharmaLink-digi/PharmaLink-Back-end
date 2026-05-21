import { supabase } from "../../database/supabase.js";
import { ApiError } from "../../utils/ApiError.js";

export const getAllMedications = async (page = 1, limit = 10, search, category) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("t_medication")
    .select("*", { count: "exact" });
    
  if (category) {
    query = query.eq('category', category);
  }
  
  if (search) {
    query = query.ilike('medication_name', `%${search}%`);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  return { medications: data, total: count, page, limit };
};

export const getMedicationById = async (id) => {
  const { data, error } = await supabase
    .from("t_medication")
    .select("*")
    .eq("medication_id", id)
    .single();

  if (error || !data) {
    throw new ApiError(404, "Medication not found");
  }

  return data;
};

export const createMedication = async (medicationData) => {
  const { data, error } = await supabase
    .from("t_medication")
    .insert([medicationData])
    .select()
    .single();

  if (error) {
    throw new ApiError(400, "Could not create medication");
  }

  return data;
};

export const updateMedication = async (id, updateData) => {
  const { data, error } = await supabase
    .from("t_medication")
    .update(updateData)
    .eq("medication_id", id)
    .select()
    .single();

  if (error || !data) {
    throw new ApiError(404, "Medication not found or could not be updated");
  }

  return data;
};

export const deleteMedication = async (id) => {
  const { error } = await supabase
    .from("t_medication")
    .delete()
    .eq("medication_id", id);

  if (error) {
    throw new ApiError(400, "Could not delete medication");
  }

  return true;
};
