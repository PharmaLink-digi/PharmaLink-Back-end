import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as saleService from "./sale.service.js";

export const getSales = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  let pharmId = req.user.role === 'pharmacy' ? req.user.pharm_id : null;
  
  const result = await saleService.getSales(pharmId, page, limit);
  res.status(200).json(new ApiResponse(200, result, "Sales fetched successfully"));
});

export const getSaleById = asyncHandler(async (req, res) => {
  let pharmId = req.user.role === 'pharmacy' ? req.user.pharm_id : null;
  const result = await saleService.getSaleById(req.params.id, pharmId, req.user.role);
  res.status(200).json(new ApiResponse(200, result, "Sale fetched successfully"));
});

export const createSale = asyncHandler(async (req, res) => {
  const pharmId = req.user.pharm_id;
  const result = await saleService.createSale(pharmId, req.body);
  res.status(201).json(new ApiResponse(201, result, "Sale recorded successfully"));
});
