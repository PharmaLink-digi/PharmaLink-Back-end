import { supabase } from "../../database/supabase.js";
import { ApiError } from "../../utils/ApiError.js";

export const getSales = async (pharmId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("sales")
    .select("*", { count: "exact" });
    
  if (pharmId) {
    query = query.eq('pharm_id', pharmId);
  }

  const { data, error, count } = await query.order('date_out', { ascending: false }).range(offset, offset + limit - 1);

  if (error) throw error;

  return { sales: data, total: count, page, limit };
};

export const getSaleById = async (id, pharmId, role) => {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("sale_id", id)
    .single();

  if (error || !data) {
    throw new ApiError(404, "Sale not found");
  }

  if (role === 'pharmacy' && data.pharm_id !== pharmId) {
    throw new ApiError(403, "You do not have permission to view this sale");
  }

  return data;
};

export const createSale = async (pharmId, saleData) => {
  const { 
    order_id, 
    client_id, 
    inventory_id, 
    warehouse_id, 
    medication_id, 
    quantity_ordered, 
    price_per_unit 
  } = saleData;

  const total_sales = quantity_ordered * price_per_unit;

  const { data, error } = await supabase
    .from("sales")
    .insert([{
      order_id,
      client_id,
      pharm_id: pharmId,
      inventory_id,
      warehouse_id,
      medication_id,
      quantity_ordered,
      price_per_unit,
      total_sales
    }])
    .select()
    .single();

  if (error) {
    throw new ApiError(400, "Could not create sale record");
  }

  // Update inventory (assuming this is a direct sale not linked to an order that already decremented inventory)
  if (!order_id) {
    const { data: currentInventory } = await supabase
      .from("t_pharm_inventory")
      .select("quantity")
      .eq("inventory_id", inventory_id)
      .single();
      
    if (currentInventory && currentInventory.quantity >= quantity_ordered) {
      await supabase
        .from("t_pharm_inventory")
        .update({ quantity: currentInventory.quantity - quantity_ordered })
        .eq("inventory_id", inventory_id);
    }
  }

  return data;
};
