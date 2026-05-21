import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as exchangeService from "./exchange.service.js";

export const getExchanges = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const type = req.query.type || 'all'; // sent, received, all
  
  let pharmId = req.user.role === 'pharmacy' ? req.user.pharm_id : null;
  
  const result = await exchangeService.getExchanges(pharmId, req.user.role, type, page, limit);
  res.status(200).json(new ApiResponse(200, result, "Exchange requests fetched successfully"));
});

export const getExchangeById = asyncHandler(async (req, res) => {
  let pharmId = req.user.role === 'pharmacy' ? req.user.pharm_id : null;
  const result = await exchangeService.getExchangeById(req.params.id, pharmId, req.user.role);
  res.status(200).json(new ApiResponse(200, result, "Exchange request fetched successfully"));
});

export const createExchange = asyncHandler(async (req, res) => {
  const fromPharmId = req.user.pharm_id;
  const result = await exchangeService.createExchange(fromPharmId, req.body);
  res.status(201).json(new ApiResponse(201, result, "Exchange request created successfully"));
});

export const updateExchangeStatus = asyncHandler(async (req, res) => {
  const pharmId = req.user.pharm_id;
  const result = await exchangeService.updateExchangeStatus(req.params.id, req.body.status, pharmId, req.user.role);
  res.status(200).json(new ApiResponse(200, result, "Exchange request status updated successfully"));
});
