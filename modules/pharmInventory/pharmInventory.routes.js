import express from "express";
import * as pharmInventoryController from "./pharmInventory.controller.js";

const pharmInventoryRouter = express.Router();

pharmInventoryRouter.get('/pharm-inventory', pharmInventoryController.getAllPharmInventory);
pharmInventoryRouter.get('/pharm-inventory/:id', pharmInventoryController.getPharmInventoryById);
pharmInventoryRouter.post('/pharm-inventory', pharmInventoryController.insertPharmInventory);
pharmInventoryRouter.put('/pharm-inventory/:id', pharmInventoryController.updatePharmInventory);
pharmInventoryRouter.delete('/pharm-inventory/:id', pharmInventoryController.deletePharmInventory);

export default pharmInventoryRouter;
