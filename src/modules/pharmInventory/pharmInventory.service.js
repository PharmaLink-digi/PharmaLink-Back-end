import { supabase } from "../../database/supabase.js";
import { ApiError } from "../../utils/ApiError.js";

export const getPharmInventory = async (pharmId, page = 1, limit = 10, search, category) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("t_pharm_inventory")
    .select("*", { count: "exact" });
    
  if (pharmId) {
    query = query.eq('pharm_id', pharmId);
  }
  
  if (search) {
    query = query.ilike('medication_name', `%${search}%`);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  return { inventory: data, total: count, page, limit };
};

export const addPharmInventoryItem = async (inventoryData) => {
  const { data, error } = await supabase
    .from("t_pharm_inventory")
    .insert([inventoryData])
    .select()
    .single();

  if (error) {
    throw new ApiError(400, "Could not add pharmacy inventory item");
  }

  return data;
};

export const updatePharmInventoryItem = async (id, updateData) => {
  const { data, error } = await supabase
    .from("t_pharm_inventory")
    .update(updateData)
    .eq("inventory_id", id)
    .select()
    .single();

  if (error || !data) {
    throw new ApiError(404, "Pharmacy inventory item not found or could not be updated");
  }

  return data;
};

export const deletePharmInventoryItem = async (id) => {
  const { error } = await supabase
    .from("t_pharm_inventory")
    .delete()
    .eq("inventory_id", id);

  if (error) {
    throw new ApiError(400, "Could not delete pharmacy inventory item");
  }

  return true;
};
