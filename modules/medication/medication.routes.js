import express from "express";
import * as medicationController from "./medication.controller.js";
import { searchMedicines } from "../search/search.controller.js";

const medicationRouter = express.Router();

medicationRouter.get('/medications', medicationController.getAllMedications);
medicationRouter.get('/medications/search', searchMedicines);
medicationRouter.get('/medications/:id', medicationController.getMedicationById);
medicationRouter.post('/medications', medicationController.insertMedication);
medicationRouter.patch('/medications/:id', medicationController.updateMedication);
medicationRouter.delete('/medications/:id', medicationController.deleteMedication);
medicationRouter.delete('/medications', medicationController.deleteMedication);

export default medicationRouter;
