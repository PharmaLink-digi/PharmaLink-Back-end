import { supabase } from "../../database/supabase.js";
import { ApiError } from "../../utils/ApiError.js";

export const getAllWarehouses = async (page = 1, limit = 10, area) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("t_warehouse")
    .select("*", { count: "exact" });
    
  if (area) {
    query = query.eq('area', area);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  return { warehouses: data, total: count, page, limit };
};

export const getWarehouseById = async (id) => {
  const { data, error } = await supabase
    .from("t_warehouse")
    .select("*")
    .eq("warehouse_id", id)
    .single();

  if (error || !data) {
    throw new ApiError(404, "Warehouse not found");
  }

  return data;
};

export const createWarehouse = async (warehouseData) => {
  const { data, error } = await supabase
    .from("t_warehouse")
    .insert([warehouseData])
    .select()
    .single();

  if (error) {
    throw new ApiError(400, "Could not create warehouse");
  }

  return data;
};

export const updateWarehouse = async (id, updateData) => {
  const { data, error } = await supabase
    .from("t_warehouse")
    .update(updateData)
    .eq("warehouse_id", id)
    .select()
    .single();

  if (error || !data) {
    throw new ApiError(404, "Warehouse not found or could not be updated");
  }

  return data;
};

export const deleteWarehouse = async (id) => {
  const { error } = await supabase
    .from("t_warehouse")
    .delete()
    .eq("warehouse_id", id);

  if (error) {
    throw new ApiError(400, "Could not delete warehouse");
  }

  return true;
};
