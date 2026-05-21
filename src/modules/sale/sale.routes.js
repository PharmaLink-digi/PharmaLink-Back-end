import express from "express";
import * as saleController from "./sale.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as saleValidation from "./sale.validation.js";
import { requireAuth, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Require auth for all sale routes
router.use(requireAuth);

router
  .route("/")
  .get(restrictTo('admin', 'pharmacy'), saleController.getSales)
  .post(restrictTo('pharmacy'), validate(saleValidation.createSaleSchema), saleController.createSale);

router
  .route("/:id")
  .get(restrictTo('admin', 'pharmacy'), saleController.getSaleById);

export default router;
