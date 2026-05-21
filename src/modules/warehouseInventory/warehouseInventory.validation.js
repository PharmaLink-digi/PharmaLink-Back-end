import { z } from "zod";

export const addInventorySchema = z.object({
  body: z.object({
    warehouse_id: z.string().uuid("Invalid warehouse ID"),
    medication_id: z.string().uuid("Invalid medication ID"),
    medication_name: z.string().min(2, "Medication name is required"),
    category: z.string().min(2, "Category is required"),
    price_per_unit: z.number().min(0, "Price cannot be negative"),
    quantity: z.number().int().min(0, "Quantity cannot be negative"),
  })
});

export const updateInventorySchema = z.object({
  body: z.object({
    price_per_unit: z.number().min(0).optional(),
    quantity: z.number().int().min(0).optional(),
  })
});
