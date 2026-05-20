import express from 'express'
import { getAllMedicines } from './medication.controller.js'
const medicationRouter = express.Router()

medicationRouter.get('/getmedications', getAllMedicines)

export default medicationRouter