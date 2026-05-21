import * as clientDB from '../../Database/client.db.js'

export let defaultUserData = (req,res)=>{
    res.send("hello")
}

export const getClients = async (req,res) => {
    try{
        const data = await clientDB.getAllClients()
        res.status(200).json(data)
    }catch(err){
        res.status(500).json({message:err.message})
    }
}

export const addNewClient = async (req, res) => {
    try{
        const {client_name, phone, email} = req.body

        if(!client_name || !phone || !email){
            return res.status(400).json({message:"all fields are required"})
        }
        const clientData = {
            client_name,
            phone, 
            email
        }
        const data = await clientDB
        .createClient(clientData)
        res.status(201).json({message:"client added successfully", data})
    }catch(err){
        res.status(500).json({message:err.message})
    }
}

