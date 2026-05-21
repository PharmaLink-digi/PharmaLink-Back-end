import express from "express";
import * as orderController from "./order.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as orderValidation from "./order.validation.js";
import { requireAuth, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Require auth for all order routes
router.use(requireAuth);

router
  .route("/")
  .get(orderController.getOrders)
  .post(restrictTo('client'), validate(orderValidation.createOrderSchema), orderController.createOrder);

router
  .route("/:id")
  .get(orderController.getOrderById);

router
  .route("/:id/status")
  .patch(restrictTo('admin', 'pharmacy'), validate(orderValidation.updateOrderStatusSchema), orderController.updateOrderStatus);

export default router;
