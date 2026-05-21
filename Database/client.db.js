import { supabase } from "./supabase.js";

export const getAllClients = async () => {
    const {data, error} = await supabase
    .from('clients') // select * from clients
    .select('*')
    if(error) throw error
    return data    
}

export const createClient = async (clientData) =>{
    const {data, error} = await supabase
    .from('clients')
    .insert([clientData])
    .select()
    if(error) throw error
    return data
}