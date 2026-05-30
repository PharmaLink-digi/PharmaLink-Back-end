import express from "express";
import { searchMedicines } from "./search.controller.js";

const router = express.Router();

// GET /search
router.get("/", searchMedicines);

export default router;
