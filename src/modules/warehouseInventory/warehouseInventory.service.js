import { supabase } from "../../database/supabase.js";
import { ApiError } from "../../utils/ApiError.js";

export const getInventory = async (warehouseId, page = 1, limit = 10, search) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("t_warehouse_inventory")
    .select("*", { count: "exact" });
    
  if (warehouseId) {
    query = query.eq('warehouse_id', warehouseId);
  }
  
  if (search) {
    query = query.ilike('medication_name', `%${search}%`);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  return { inventory: data, total: count, page, limit };
};

export const addInventoryItem = async (inventoryData) => {
  const { data, error } = await supabase
    .from("t_warehouse_inventory")
    .insert([inventoryData])
    .select()
    .single();

  if (error) {
    throw new ApiError(400, "Could not add inventory item");
  }

  return data;
};

export const updateInventoryItem = async (id, updateData) => {
  const { data, error } = await supabase
    .from("t_warehouse_inventory")
    .update(updateData)
    .eq("w_inventory_id", id)
    .select()
    .single();

  if (error || !data) {
    throw new ApiError(404, "Inventory item not found or could not be updated");
  }

  return data;
};

export const deleteInventoryItem = async (id) => {
  const { error } = await supabase
    .from("t_warehouse_inventory")
    .delete()
    .eq("w_inventory_id", id);

  if (error) {
    throw new ApiError(400, "Could not delete inventory item");
  }

  return true;
};
