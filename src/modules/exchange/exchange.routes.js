import express from "express";
import * as exchangeController from "./exchange.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as exchangeValidation from "./exchange.validation.js";
import { requireAuth, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Require auth for all exchange routes
router.use(requireAuth);

router
  .route("/")
  .get(restrictTo('admin', 'pharmacy'), exchangeController.getExchanges)
  .post(restrictTo('pharmacy'), validate(exchangeValidation.createExchangeSchema), exchangeController.createExchange);

router
  .route("/:id")
  .get(restrictTo('admin', 'pharmacy'), exchangeController.getExchangeById);

router
  .route("/:id/status")
  .patch(restrictTo('admin', 'pharmacy'), validate(exchangeValidation.updateExchangeStatusSchema), exchangeController.updateExchangeStatus);

export default router;
