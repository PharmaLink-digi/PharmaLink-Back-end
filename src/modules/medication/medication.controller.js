import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as medicationService from "./medication.service.js";

export const getAllMedications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search;
  const category = req.query.category;
  
  const result = await medicationService.getAllMedications(page, limit, search, category);
  res.status(200).json(new ApiResponse(200, result, "Medications fetched successfully"));
});

export const getMedicationById = asyncHandler(async (req, res) => {
  const result = await medicationService.getMedicationById(req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Medication fetched successfully"));
});

export const createMedication = asyncHandler(async (req, res) => {
  const result = await medicationService.createMedication(req.body);
  res.status(201).json(new ApiResponse(201, result, "Medication created successfully"));
});

export const updateMedication = asyncHandler(async (req, res) => {
  const result = await medicationService.updateMedication(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, "Medication updated successfully"));
});

export const deleteMedication = asyncHandler(async (req, res) => {
  await medicationService.deleteMedication(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Medication deleted successfully"));
});
