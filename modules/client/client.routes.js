import express from "express";
import * as clientController from "./client.controller.js";

const clientRouter = express.Router();

clientRouter.get('/clients', clientController.getAllClients);
clientRouter.get('/clients/:id', clientController.getClientById);
clientRouter.post('/clients', clientController.insertClient);
clientRouter.put('/clients/:id', clientController.updateClient);
clientRouter.delete('/clients/:id', clientController.deleteClient);

export default clientRouter;
