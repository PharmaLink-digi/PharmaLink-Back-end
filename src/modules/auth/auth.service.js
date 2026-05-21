import bcrypt from "bcryptjs";
import { supabase } from "../../database/supabase.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateToken } from "../../services/jwt.service.js";

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const registerClient = async (clientData) => {
  const { email, password, client_name, phone } = clientData;

  // Check if client exists
  const { data: existingClient } = await supabase
    .from("t_client")
    .select("client_id")
    .eq("email", email)
    .single();

  if (existingClient) {
    throw new ApiError(409, "Client with this email already exists");
  }

  const password_hash = await hashPassword(password);

  const { data: newClient, error } = await supabase
    .from("t_client")
    .insert([{ client_name, phone, email, password_hash, role: 'client' }])
    .select("client_id, client_name, email, role")
    .single();

  if (error) throw error;

  const token = generateToken({ id: newClient.client_id, role: newClient.role });

  return { user: newClient, token };
};

export const registerPharmacy = async (pharmacyData) => {
  const { email, password, pharm_name, phone, address, area } = pharmacyData;

  const { data: existingPharmacy } = await supabase
    .from("t_pharm_info")
    .select("pharm_id")
    .eq("email", email)
    .single();

  if (existingPharmacy) {
    throw new ApiError(409, "Pharmacy with this email already exists");
  }

  const password_hash = await hashPassword(password);

  const { data: newPharmacy, error } = await supabase
    .from("t_pharm_info")
    .insert([{ pharm_name, phone, address, area, email, password_hash, role: 'pharmacy' }])
    .select("pharm_id, pharm_name, email, role")
    .single();

  if (error) throw error;

  const token = generateToken({ id: newPharmacy.pharm_id, role: newPharmacy.role });

  return { user: newPharmacy, token };
};

export const login = async (email, password) => {
  // Check client first
  let { data: user } = await supabase
    .from("t_client")
    .select("*")
    .eq("email", email)
    .single();

  let role = "client";
  let idField = "client_id";

  if (!user) {
    // Check pharmacy
    const { data: pharmacy } = await supabase
      .from("t_pharm_info")
      .select("*")
      .eq("email", email)
      .single();
    
    if (pharmacy) {
      user = pharmacy;
      role = "pharmacy";
      idField = "pharm_id";
    }
  }

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await comparePassword(password, user.password_hash);

  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken({ id: user[idField], role: user.role || role });
  
  delete user.password_hash; // Don't send password hash in response

  return { user, token };
};
