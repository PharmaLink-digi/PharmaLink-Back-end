import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as pharmacyService from "./pharmacy.service.js";

export const getAllPharmacies = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const area = req.query.area;
  
  const result = await pharmacyService.getAllPharmacies(page, limit, area);
  res.status(200).json(new ApiResponse(200, result, "Pharmacies fetched successfully"));
});

export const getPharmacyById = asyncHandler(async (req, res) => {
  const result = await pharmacyService.getPharmacyById(req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Pharmacy fetched successfully"));
});

export const updatePharmacy = asyncHandler(async (req, res) => {
  // A pharmacy can only update its own profile unless admin
  if (req.user.role !== 'admin' && req.user.pharm_id !== req.params.id) {
    return res.status(403).json(new ApiResponse(403, null, "You can only update your own pharmacy profile"));
  }

  const result = await pharmacyService.updatePharmacy(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, "Pharmacy updated successfully"));
});

export const deletePharmacy = asyncHandler(async (req, res) => {
  await pharmacyService.deletePharmacy(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Pharmacy deleted successfully"));
});
