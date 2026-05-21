import { supabase } from "../../database/supabase.js";
import { ApiError } from "../../utils/ApiError.js";

export const getAllPharmacies = async (page = 1, limit = 10, area) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("t_pharm_info")
    .select("pharm_id, pharm_name, phone, email, address, area, discount_percent", { count: "exact" });
    
  if (area) {
    query = query.eq('area', area);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  return { pharmacies: data, total: count, page, limit };
};

export const getPharmacyById = async (id) => {
  const { data, error } = await supabase
    .from("t_pharm_info")
    .select("pharm_id, pharm_name, phone, email, address, area, discount_percent")
    .eq("pharm_id", id)
    .single();

  if (error || !data) {
    throw new ApiError(404, "Pharmacy not found");
  }

  return data;
};

export const updatePharmacy = async (id, updateData) => {
  const { data, error } = await supabase
    .from("t_pharm_info")
    .update(updateData)
    .eq("pharm_id", id)
    .select("pharm_id, pharm_name, phone, email, address, area, discount_percent")
    .single();

  if (error || !data) {
    throw new ApiError(404, "Pharmacy not found or could not be updated");
  }

  return data;
};

export const deletePharmacy = async (id) => {
  const { error } = await supabase
    .from("t_pharm_info")
    .delete()
    .eq("pharm_id", id);

  if (error) {
    throw new ApiError(400, "Could not delete pharmacy");
  }

  return true;
};
