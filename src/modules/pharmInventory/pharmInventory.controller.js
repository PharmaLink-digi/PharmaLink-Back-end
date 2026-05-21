import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as pharmInventoryService from "./pharmInventory.service.js";

export const getPharmInventory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search;
  const category = req.query.category;
  
  // If user is a pharmacy, they can see their own inventory by default if not specified
  let pharmId = req.query.pharm_id;
  if (!pharmId && req.user.role === 'pharmacy') {
    pharmId = req.user.pharm_id;
  }
  
  const result = await pharmInventoryService.getPharmInventory(pharmId, page, limit, search, category);
  res.status(200).json(new ApiResponse(200, result, "Pharmacy inventory fetched successfully"));
});

export const addPharmInventoryItem = asyncHandler(async (req, res) => {
  // Ensure pharmacy only adds to their own inventory unless admin
  if (req.user.role !== 'admin') {
    req.body.pharm_id = req.user.pharm_id;
  }

  const result = await pharmInventoryService.addPharmInventoryItem(req.body);
  res.status(201).json(new ApiResponse(201, result, "Pharmacy inventory item added successfully"));
});

export const updatePharmInventoryItem = asyncHandler(async (req, res) => {
  const result = await pharmInventoryService.updatePharmInventoryItem(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, "Pharmacy inventory item updated successfully"));
});

export const deletePharmInventoryItem = asyncHandler(async (req, res) => {
  await pharmInventoryService.deletePharmInventoryItem(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Pharmacy inventory item deleted successfully"));
});
