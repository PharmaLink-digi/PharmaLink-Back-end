import { z } from "zod";

export const createMedicationSchema = z.object({
  body: z.object({
    medication_name: z.string().min(2, "Medication name is required"),
    medication_type: z.string().min(2, "Medication type is required"),
    category: z.string().min(2, "Category is required"),
    manufacturer: z.string().min(2, "Manufacturer is required"),
  })
});

export const updateMedicationSchema = z.object({
  body: z.object({
    medication_name: z.string().min(2).optional(),
    medication_type: z.string().min(2).optional(),
    category: z.string().min(2).optional(),
    manufacturer: z.string().min(2).optional(),
  })
});
