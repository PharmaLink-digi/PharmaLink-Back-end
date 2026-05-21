import express from "express";
import * as pharmInventoryController from "./pharmInventory.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as pharmInventoryValidation from "./pharmInventory.validation.js";
import { requireAuth, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Require auth for all pharmacy inventory routes
router.use(requireAuth);

router
  .route("/")
  .get(pharmInventoryController.getPharmInventory)
  .post(restrictTo('admin', 'pharmacy'), validate(pharmInventoryValidation.addPharmInventorySchema), pharmInventoryController.addPharmInventoryItem);

router
  .route("/:id")
  .patch(restrictTo('admin', 'pharmacy'), validate(pharmInventoryValidation.updatePharmInventorySchema), pharmInventoryController.updatePharmInventoryItem)
  .delete(restrictTo('admin', 'pharmacy'), pharmInventoryController.deletePharmInventoryItem);

export default router;
