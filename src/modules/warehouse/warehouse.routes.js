import express from "express";
import * as warehouseController from "./warehouse.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as warehouseValidation from "./warehouse.validation.js";
import { requireAuth, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Require auth for all warehouse routes
router.use(requireAuth);

router
  .route("/")
  .get(warehouseController.getAllWarehouses)
  .post(restrictTo('admin'), validate(warehouseValidation.createWarehouseSchema), warehouseController.createWarehouse);

router
  .route("/:id")
  .get(warehouseController.getWarehouseById)
  .patch(restrictTo('admin'), validate(warehouseValidation.updateWarehouseSchema), warehouseController.updateWarehouse)
  .delete(restrictTo('admin'), warehouseController.deleteWarehouse);

export default router;
