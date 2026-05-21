import express from "express";
import * as inventoryController from "./warehouseInventory.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as inventoryValidation from "./warehouseInventory.validation.js";
import { requireAuth, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Require auth for all inventory routes
router.use(requireAuth);

router
  .route("/")
  .get(inventoryController.getInventory) // Accessible by all logged in users
  .post(restrictTo('admin'), validate(inventoryValidation.addInventorySchema), inventoryController.addInventoryItem);

router
  .route("/:id")
  .patch(restrictTo('admin'), validate(inventoryValidation.updateInventorySchema), inventoryController.updateInventoryItem)
  .delete(restrictTo('admin'), inventoryController.deleteInventoryItem);

export default router;
