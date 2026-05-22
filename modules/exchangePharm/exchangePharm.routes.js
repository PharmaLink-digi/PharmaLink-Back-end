import express from "express";
import * as exchangePharmController from "./exchangePharm.controller.js";

const exchangePharmRouter = express.Router();

exchangePharmRouter.get('/exchange-pharm', exchangePharmController.getAllExchanges);
exchangePharmRouter.get('/exchange-pharm/:id', exchangePharmController.getExchangeById);
exchangePharmRouter.post('/exchange-pharm', exchangePharmController.insertExchange);
exchangePharmRouter.put('/exchange-pharm/:id', exchangePharmController.updateExchange);
exchangePharmRouter.delete('/exchange-pharm/:id', exchangePharmController.deleteExchange);

export default exchangePharmRouter;
