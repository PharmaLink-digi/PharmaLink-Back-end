import express from "express";
import * as warehouseInventoryController from "./warehouseInventory.controller.js";

const warehouseInventoryRouter = express.Router();

warehouseInventoryRouter.get('/warehouse-inventory', warehouseInventoryController.getAllWarehouseInventory);
warehouseInventoryRouter.get('/warehouse-inventory/:id', warehouseInventoryController.getWarehouseInventoryById);
warehouseInventoryRouter.post('/warehouse-inventory', warehouseInventoryController.insertWarehouseInventory);
warehouseInventoryRouter.put('/warehouse-inventory/:id', warehouseInventoryController.updateWarehouseInventory);
warehouseInventoryRouter.delete('/warehouse-inventory/:id', warehouseInventoryController.deleteWarehouseInventory);

export default warehouseInventoryRouter;
