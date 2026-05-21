import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as orderService from "./order.service.js";

export const getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  // Identify user from auth token (id and role)
  let userId;
  if (req.user.role === 'client') userId = req.user.client_id;
  if (req.user.role === 'pharmacy') userId = req.user.pharm_id;
  if (req.user.role === 'admin') userId = null; // Admin sees all
  
  const result = await orderService.getOrders(userId, req.user.role, page, limit);
  res.status(200).json(new ApiResponse(200, result, "Orders fetched successfully"));
});

export const getOrderById = asyncHandler(async (req, res) => {
  let userId;
  if (req.user.role === 'client') userId = req.user.client_id;
  if (req.user.role === 'pharmacy') userId = req.user.pharm_id;
  
  const result = await orderService.getOrderById(req.params.id, userId, req.user.role);
  res.status(200).json(new ApiResponse(200, result, "Order fetched successfully"));
});

export const createOrder = asyncHandler(async (req, res) => {
  const clientId = req.user.client_id;
  const result = await orderService.createOrder(clientId, req.body);
  res.status(201).json(new ApiResponse(201, result, "Order created successfully"));
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const pharmId = req.user.pharm_id;
  const result = await orderService.updateOrderStatus(req.params.id, req.body.status, pharmId, req.user.role);
  res.status(200).json(new ApiResponse(200, result, "Order status updated successfully"));
});
