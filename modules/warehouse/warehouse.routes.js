import express from "express";
import * as warehouseController from "./warehouse.controller.js";

const warehouseRouter = express.Router();

warehouseRouter.get('/warehouses', warehouseController.getAllWarehouses);
warehouseRouter.get('/warehouses/:id', warehouseController.getWarehouseById);
warehouseRouter.post('/warehouses', warehouseController.insertWarehouse);
warehouseRouter.put('/warehouses/:id', warehouseController.updateWarehouse);
warehouseRouter.delete('/warehouses/:id', warehouseController.deleteWarehouse);

export default warehouseRouter;
