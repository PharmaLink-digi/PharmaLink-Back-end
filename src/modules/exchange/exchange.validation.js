import { z } from "zod";

export const createExchangeSchema = z.object({
  body: z.object({
    to_pharm_id: z.string().uuid("Invalid target pharmacy ID"),
    inventory_id: z.string().uuid("Invalid inventory ID"),
    warehouse_id: z.string().uuid("Invalid warehouse ID").optional().nullable(),
    medication_id: z.string().uuid("Invalid medication ID"),
    quantity_requested: z.number().int().min(1, "Quantity must be at least 1"),
    price_sell: z.number().min(0, "Price cannot be negative"),
    discount_percent: z.number().min(0).max(100).optional(),
    price_after_discount: z.number().min(0).optional(),
  })
});

export const updateExchangeStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'accepted', 'rejected', 'completed'], {
      errorMap: () => ({ message: 'Invalid status' })
    })
  })
});
