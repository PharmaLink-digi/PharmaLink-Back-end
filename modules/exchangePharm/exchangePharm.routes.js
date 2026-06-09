import express from "express";
import * as exchangePharmController from "./exchangePharm.controller.js";

const exchangePharmRouter = express.Router();

exchangePharmRouter.get('/exchange-pharm', exchangePharmController.getExchangesByQuery);
exchangePharmRouter.get('/exchange-pharm/:id', exchangePharmController.getExchangeById);
exchangePharmRouter.post('/exchange-pharm', exchangePharmController.insertExchange);
exchangePharmRouter.patch('/exchange-pharm/:id', exchangePharmController.patchExchange);
exchangePharmRouter.delete('/exchange-pharm/:id', exchangePharmController.deleteExchangeById);
exchangePharmRouter.delete('/exchange-pharm', exchangePharmController.deleteExchangesByQuery);

export default exchangePharmRouter;
