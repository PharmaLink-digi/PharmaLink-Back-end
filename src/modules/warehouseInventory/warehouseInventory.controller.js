import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as inventoryService from "./warehouseInventory.service.js";

export const getInventory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search;
  const warehouseId = req.query.warehouse_id;
  
  const result = await inventoryService.getInventory(warehouseId, page, limit, search);
  res.status(200).json(new ApiResponse(200, result, "Inventory fetched successfully"));
});

export const addInventoryItem = asyncHandler(async (req, res) => {
  const result = await inventoryService.addInventoryItem(req.body);
  res.status(201).json(new ApiResponse(201, result, "Inventory item added successfully"));
});

export const updateInventoryItem = asyncHandler(async (req, res) => {
  const result = await inventoryService.updateInventoryItem(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, "Inventory item updated successfully"));
});

export const deleteInventoryItem = asyncHandler(async (req, res) => {
  await inventoryService.deleteInventoryItem(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Inventory item deleted successfully"));
});
