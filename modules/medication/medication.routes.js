import express from 'express'
const medicationRouter = express.Router()

medicationRouter.get('/getmedications', getAllMedicines)