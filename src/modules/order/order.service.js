import { supabase } from "../../database/supabase.js";
import { ApiError } from "../../utils/ApiError.js";

export const getOrders = async (userId, role, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("t_orders")
    .select("*, t_order_details(*)", { count: "exact" });
    
  if (role === 'client') {
    query = query.eq('client_id', userId);
  } else if (role === 'pharmacy') {
    query = query.eq('pharm_id', userId);
  }

  const { data, error, count } = await query.order('order_date', { ascending: false }).range(offset, offset + limit - 1);

  if (error) throw error;

  return { orders: data, total: count, page, limit };
};

export const getOrderById = async (id, userId, role) => {
  const { data, error } = await supabase
    .from("t_orders")
    .select("*, t_order_details(*)")
    .eq("order_id", id)
    .single();

  if (error || !data) {
    throw new ApiError(404, "Order not found");
  }

  if (role === 'client' && data.client_id !== userId) {
    throw new ApiError(403, "You do not have permission to view this order");
  }

  if (role === 'pharmacy' && data.pharm_id !== userId) {
    throw new ApiError(403, "You do not have permission to view this order");
  }

  return data;
};

export const createOrder = async (clientId, orderData) => {
  const { pharm_id, items } = orderData;
  
  // Start a simulated transaction by inserting order first, then details
  // Note: Supabase JS doesn't have true transactions without calling a Postgres function (RPC)
  // We'll do it sequentially for now
  
  const { data: order, error: orderError } = await supabase
    .from("t_orders")
    .insert([{
      client_id: clientId,
      pharm_id,
      status: 'pending'
    }])
    .select()
    .single();

  if (orderError) {
    throw new ApiError(400, "Could not create order");
  }

  // Fetch inventory details for each item to calculate totals
  const orderDetails = [];
  
  for (const item of items) {
    const { data: inventoryItem } = await supabase
      .from("t_pharm_inventory")
      .select("*")
      .eq("inventory_id", item.inventory_id)
      .single();
      
    if (!inventoryItem || inventoryItem.pharm_id !== pharm_id) {
      throw new ApiError(400, `Invalid inventory item ${item.inventory_id}`);
    }
    
    if (inventoryItem.quantity < item.quantity) {
      throw new ApiError(400, `Insufficient quantity for ${inventoryItem.medication_name}`);
    }
    
    orderDetails.push({
      order_id: order.order_id,
      client_id: clientId,
      pharm_id: pharm_id,
      inventory_id: item.inventory_id,
      medication_id: inventoryItem.medication_id,
      medication_name: inventoryItem.medication_name,
      medication_type: inventoryItem.medication_type,
      category: inventoryItem.category,
      quantity: item.quantity,
      unit_price: inventoryItem.price_sell,
      line_total: inventoryItem.price_sell * item.quantity
    });
  }

  const { error: detailsError } = await supabase
    .from("t_order_details")
    .insert(orderDetails);

  if (detailsError) {
    // Ideally rollback here
    throw new ApiError(400, "Could not add order details");
  }

  // Update inventory quantities
  for (const item of items) {
    const detail = orderDetails.find(d => d.inventory_id === item.inventory_id);
    const { data: currentInventory } = await supabase
      .from("t_pharm_inventory")
      .select("quantity")
      .eq("inventory_id", item.inventory_id)
      .single();
      
    await supabase
      .from("t_pharm_inventory")
      .update({ quantity: currentInventory.quantity - item.quantity })
      .eq("inventory_id", item.inventory_id);
  }

  return { order, items: orderDetails };
};

export const updateOrderStatus = async (id, status, pharmId, role) => {
  const { data: order } = await supabase
    .from("t_orders")
    .select("*")
    .eq("order_id", id)
    .single();
    
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  
  if (role === 'pharmacy' && order.pharm_id !== pharmId) {
    throw new ApiError(403, "You don't have permission to update this order");
  }

  const { data, error } = await supabase
    .from("t_orders")
    .update({ status })
    .eq("order_id", id)
    .select()
    .single();

  if (error) {
    throw new ApiError(400, "Could not update order status");
  }

  return data;
};
