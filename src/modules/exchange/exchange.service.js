import { supabase } from "../../database/supabase.js";
import { ApiError } from "../../utils/ApiError.js";

export const getExchanges = async (pharmId, role, type = 'all', page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("t_exchange_pharm")
    .select("*", { count: "exact" });
    
  if (role === 'pharmacy') {
    if (type === 'sent') {
      query = query.eq('from_pharm_id', pharmId);
    } else if (type === 'received') {
      query = query.eq('to_pharm_id', pharmId);
    } else {
      query = query.or(`from_pharm_id.eq.${pharmId},to_pharm_id.eq.${pharmId}`);
    }
  }

  const { data, error, count } = await query.order('request_date', { ascending: false }).range(offset, offset + limit - 1);

  if (error) throw error;

  return { exchanges: data, total: count, page, limit };
};

export const getExchangeById = async (id, pharmId, role) => {
  const { data, error } = await supabase
    .from("t_exchange_pharm")
    .select("*")
    .eq("request_id", id)
    .single();

  if (error || !data) {
    throw new ApiError(404, "Exchange request not found");
  }

  if (role === 'pharmacy' && data.from_pharm_id !== pharmId && data.to_pharm_id !== pharmId) {
    throw new ApiError(403, "You do not have permission to view this exchange");
  }

  return data;
};

export const createExchange = async (fromPharmId, exchangeData) => {
  const { data, error } = await supabase
    .from("t_exchange_pharm")
    .insert([{
      ...exchangeData,
      from_pharm_id: fromPharmId,
      status: 'pending'
    }])
    .select()
    .single();

  if (error) {
    throw new ApiError(400, "Could not create exchange request");
  }

  return data;
};

export const updateExchangeStatus = async (id, status, pharmId, role) => {
  const { data: exchange } = await supabase
    .from("t_exchange_pharm")
    .select("*")
    .eq("request_id", id)
    .single();
    
  if (!exchange) {
    throw new ApiError(404, "Exchange request not found");
  }
  
  if (role === 'pharmacy' && exchange.to_pharm_id !== pharmId) {
    throw new ApiError(403, "Only the receiving pharmacy can update the status");
  }

  const { data, error } = await supabase
    .from("t_exchange_pharm")
    .update({ status })
    .eq("request_id", id)
    .select()
    .single();

  if (error) {
    throw new ApiError(400, "Could not update exchange status");
  }

  return data;
};
