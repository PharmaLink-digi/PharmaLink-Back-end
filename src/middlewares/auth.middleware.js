import { verifyToken } from "../services/jwt.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { supabase } from "../database/supabase.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  // --- TEMPORARILY BYPASS JWT AUTHENTICATION ---
  // Dummy user for testing
  req.user = { id: 1, role: "admin" };
  return next();
  // -------------------------------------------

  /* Original Auth Logic
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "You are not logged in. Please log in to get access.");
  }

  const decoded = verifyToken(token);

  // Check if user still exists (could be client, pharm_info, or admin)
  let currentUser;
  
  if (decoded.role === 'client') {
    const { data } = await supabase.from('t_client').select('*').eq('client_id', decoded.id).single();
    currentUser = data;
  } else if (decoded.role === 'pharmacy') {
    const { data } = await supabase.from('t_pharm_info').select('*').eq('pharm_id', decoded.id).single();
    currentUser = data;
  } else if (decoded.role === 'admin') {
    // Handling admin if we store them somewhere, or maybe it's a specific pharmacy user or another table
    // For now we'll just mock it or assume it's in a users table
    currentUser = { id: decoded.id, role: 'admin' };
  }

  if (!currentUser) {
    throw new ApiError(401, "The user belonging to this token does no longer exist.");
  }

  // Grant access to protected route
  req.user = currentUser;
  req.user.role = decoded.role;
  next();
  */
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }
    next();
  };
};
