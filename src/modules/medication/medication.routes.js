import express from "express";
import * as medicationController from "./medication.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as medicationValidation from "./medication.validation.js";
import { requireAuth, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Require auth for all medication routes
router.use(requireAuth);

router
  .route("/")
  .get(medicationController.getAllMedications)
  .post(restrictTo('admin'), validate(medicationValidation.createMedicationSchema), medicationController.createMedication);

router
  .route("/:id")
  .get(medicationController.getMedicationById)
  .patch(restrictTo('admin'), validate(medicationValidation.updateMedicationSchema), medicationController.updateMedication)
  .delete(restrictTo('admin'), medicationController.deleteMedication);

export default router;
