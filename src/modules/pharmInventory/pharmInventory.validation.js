import { z } from "zod";

export const addPharmInventorySchema = z.object({
  body: z.object({
    pharm_id: z.string().uuid("Invalid pharmacy ID"),
    warehouse_id: z.string().uuid("Invalid warehouse ID").optional().nullable(),
    medication_id: z.string().uuid("Invalid medication ID"),
    medication_name: z.string().min(2, "Medication name is required"),
    medication_type: z.string().min(2, "Medication type is required"),
    category: z.string().min(2, "Category is required"),
    warehouse_price: z.number().min(0).optional(),
    price_sell: z.number().min(0, "Sell price cannot be negative"),
    movement_type: z.string().optional(),
    quantity: z.number().int().min(0, "Quantity cannot be negative"),
    availability: z.boolean().optional(),
    date_expiry: z.string().optional(),
  })
});

export const updatePharmInventorySchema = z.object({
  body: z.object({
    price_sell: z.number().min(0).optional(),
    quantity: z.number().int().min(0).optional(),
    availability: z.boolean().optional(),
    date_expiry: z.string().optional(),
  })
});
