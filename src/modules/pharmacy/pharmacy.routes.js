import express from "express";
import * as pharmacyController from "./pharmacy.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as pharmacyValidation from "./pharmacy.validation.js";
import { requireAuth, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Require auth for all pharmacy routes
router.use(requireAuth);

router
  .route("/")
  .get(pharmacyController.getAllPharmacies); // accessible by all logged-in users (client, pharmacy, admin)

router
  .route("/:id")
  .get(pharmacyController.getPharmacyById)
  .patch(restrictTo('admin', 'pharmacy'), validate(pharmacyValidation.updatePharmacySchema), pharmacyController.updatePharmacy)
  .delete(restrictTo('admin'), pharmacyController.deletePharmacy);

export default router;
