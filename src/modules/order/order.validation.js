import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    pharm_id: z.string().uuid("Invalid pharmacy ID"),
    items: z.array(z.object({
      inventory_id: z.string().uuid("Invalid inventory ID"),
      quantity: z.number().int().min(1, "Quantity must be at least 1")
    })).min(1, "Order must contain at least one item")
  })
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'], {
      errorMap: () => ({ message: 'Invalid status' })
    })
  })
});
