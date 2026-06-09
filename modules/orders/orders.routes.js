import express from "express";
import * as ordersController from "./orders.controller.js";

const ordersRouter = express.Router();

ordersRouter.get('/orders', ordersController.getAllOrders);
ordersRouter.get('/orders/:id', ordersController.getOrderById);
ordersRouter.post('/orders', ordersController.insertOrder);
ordersRouter.patch('/orders/:id', ordersController.updateOrder);
ordersRouter.delete('/orders/:id', ordersController.deleteOrder);
ordersRouter.delete('/orders', ordersController.deleteOrder);

export default ordersRouter;
