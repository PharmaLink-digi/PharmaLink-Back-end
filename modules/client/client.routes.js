import express from 'express'
import { addNewClient, defaultUserData, getClients } from './client.controller.js';
import { clientsDB } from '../../Database/DbConnection.js';
const clientRouter = express.Router();

clientRouter.get('/', defaultUserData)


clientRouter.post("/registernewclient", addNewClient)

clientRouter.get('/clients', getClients)

export default clientRouter;