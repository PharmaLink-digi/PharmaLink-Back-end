import { medicine } from "../../Database/DbConnection"

let getAllMedicines = (req,res)=>{
    res.json(medicine)
}