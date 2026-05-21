import express from "express";
import * as authController from "./auth.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as authValidation from "./auth.validation.js";

const router = express.Router();

router.post(
  "/register/client",
  validate(authValidation.registerClientSchema),
  authController.registerClient
);

router.post(
  "/register/pharmacy",
  validate(authValidation.registerPharmacySchema),
  authController.registerPharmacy
);

router.post(
  "/login",
  validate(authValidation.loginSchema),
  authController.login
);

export default router;
