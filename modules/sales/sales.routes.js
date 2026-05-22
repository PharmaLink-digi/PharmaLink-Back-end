import express from "express";
import * as salesController from "./sales.controller.js";

const salesRouter = express.Router();

salesRouter.get('/sales', salesController.getAllSales);
salesRouter.get('/sales/:id', salesController.getSaleById);
salesRouter.post('/sales', salesController.insertSale);
salesRouter.put('/sales/:id', salesController.updateSale);
salesRouter.delete('/sales/:id', salesController.deleteSale);

export default salesRouter;
