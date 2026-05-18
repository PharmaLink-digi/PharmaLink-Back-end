import express from 'express'
import { defaultUserData } from './client.controller';
const router = express.Router();

router.get('/', defaultUserData)


export default router;