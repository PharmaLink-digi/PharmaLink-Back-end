import express from "express";
import * as orderDetailsController from "./orderDetails.controller.js";

const orderDetailsRouter = express.Router();

orderDetailsRouter.get('/order-details', orderDetailsController.getAllOrderDetails);
orderDetailsRouter.get('/order-details/:id', orderDetailsController.getOrderDetailById);
orderDetailsRouter.post('/order-details', orderDetailsController.insertOrderDetail);
orderDetailsRouter.patch('/order-details/:id', orderDetailsController.updateOrderDetail);
orderDetailsRouter.delete('/order-details/:id', orderDetailsController.deleteOrderDetail);
orderDetailsRouter.delete('/order-details', orderDetailsController.deleteOrderDetail);

export default orderDetailsRouter;
