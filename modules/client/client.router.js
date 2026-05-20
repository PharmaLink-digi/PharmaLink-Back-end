import express from 'express'
import { defaultUserData } from './client.controller.js';
import { clientsDB } from '../../Database/DbConnection.js';
const router = express.Router();

router.get('/', defaultUserData)


router.post("/registernewclient", (req,res)=>{
    let newClient = req.body
    let client = clientsDB.find(client=> client.email == newClient.email)
    if(!client)
        res.json({message:"client added"})
    else
        res.json({message:"client already exist"})

})

export default router;