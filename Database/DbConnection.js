import { json } from 'express'
import clients from './clients.json' with {type:"json"}
import pharmacies from './pharm_info.json' with {type:"json"}

export let clientsDB = clients

export let pharmaciesDB = pharmacies

