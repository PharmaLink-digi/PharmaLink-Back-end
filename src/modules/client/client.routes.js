import express from "express";
import * as clientController from "./client.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as clientValidation from "./client.validation.js";
import { requireAuth, restrictTo } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Require auth for all client routes
router.use(requireAuth);

router
  .route("/")
  .get(restrictTo('admin', 'pharmacy'), clientController.getAllClients);

router
  .route("/:id")
  .get(clientController.getClientById)
  .patch(validate(clientValidation.updateClientSchema), clientController.updateClient)
  .delete(restrictTo('admin'), clientController.deleteClient);

export default router;
