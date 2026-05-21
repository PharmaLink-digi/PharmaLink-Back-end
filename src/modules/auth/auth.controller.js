import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as authService from "./auth.service.js";

export const registerClient = asyncHandler(async (req, res) => {
  const result = await authService.registerClient(req.body);
  res.status(201).json(new ApiResponse(201, result, "Client registered successfully"));
});

export const registerPharmacy = asyncHandler(async (req, res) => {
  const result = await authService.registerPharmacy(req.body);
  res.status(201).json(new ApiResponse(201, result, "Pharmacy registered successfully"));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.status(200).json(new ApiResponse(200, result, "Login successful"));
});
