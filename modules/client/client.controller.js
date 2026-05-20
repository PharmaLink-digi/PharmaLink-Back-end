import { supabase } from "../../Database/supabase.js"

export let defaultUserData = (req,res)=>{
    res.send("hello")
}



export const getClients = async (req, res) => {

  const { data, error } = await supabase
    .from('clients')
    .select('*')

  if (error) {
    return res.status(400).json(error)
  }

  res.json(data)
}