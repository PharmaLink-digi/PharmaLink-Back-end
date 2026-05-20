import { medicine } from "../../Database/DbConnection.js"

export let getAllMedicines = (req,res)=>{
    res.json(medicine)
}