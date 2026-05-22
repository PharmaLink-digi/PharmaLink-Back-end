import express from "express";
import * as pharmInfoController from "./pharmInfo.controller.js";

const pharmInfoRouter = express.Router();

pharmInfoRouter.get('/pharm-info', pharmInfoController.getAllPharmacies);
pharmInfoRouter.get('/pharm-info/:id', pharmInfoController.getPharmacyById);
pharmInfoRouter.post('/pharm-info', pharmInfoController.insertPharmacy);
pharmInfoRouter.put('/pharm-info/:id', pharmInfoController.updatePharmacy);
pharmInfoRouter.delete('/pharm-info/:id', pharmInfoController.deletePharmacy);

export default pharmInfoRouter;
