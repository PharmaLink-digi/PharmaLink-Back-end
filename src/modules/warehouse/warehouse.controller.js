import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as warehouseService from "./warehouse.service.js";

export const getAllWarehouses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const area = req.query.area;
  
  const result = await warehouseService.getAllWarehouses(page, limit, area);
  res.status(200).json(new ApiResponse(200, result, "Warehouses fetched successfully"));
});

export const getWarehouseById = asyncHandler(async (req, res) => {
  const result = await warehouseService.getWarehouseById(req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Warehouse fetched successfully"));
});

export const createWarehouse = asyncHandler(async (req, res) => {
  const result = await warehouseService.createWarehouse(req.body);
  res.status(201).json(new ApiResponse(201, result, "Warehouse created successfully"));
});

export const updateWarehouse = asyncHandler(async (req, res) => {
  const result = await warehouseService.updateWarehouse(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, "Warehouse updated successfully"));
});

export const deleteWarehouse = asyncHandler(async (req, res) => {
  await warehouseService.deleteWarehouse(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Warehouse deleted successfully"));
});
