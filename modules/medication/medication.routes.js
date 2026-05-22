import express from "express";
import * as medicationController from "./medication.controller.js";

const medicationRouter = express.Router();

medicationRouter.get('/medications', medicationController.getAllMedications);
medicationRouter.get('/medications/:id', medicationController.getMedicationById);
medicationRouter.post('/medications', medicationController.insertMedication);
medicationRouter.put('/medications/:id', medicationController.updateMedication);
medicationRouter.delete('/medications/:id', medicationController.deleteMedication);

export default medicationRouter;
