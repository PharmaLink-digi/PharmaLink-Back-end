import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as clientService from "./client.service.js";

export const getAllClients = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const result = await clientService.getAllClients(page, limit);
  res.status(200).json(new ApiResponse(200, result, "Clients fetched successfully"));
});

export const getClientById = asyncHandler(async (req, res) => {
  const result = await clientService.getClientById(req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Client fetched successfully"));
});

export const updateClient = asyncHandler(async (req, res) => {
  const result = await clientService.updateClient(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, "Client updated successfully"));
});

export const deleteClient = asyncHandler(async (req, res) => {
  await clientService.deleteClient(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Client deleted successfully"));
});
