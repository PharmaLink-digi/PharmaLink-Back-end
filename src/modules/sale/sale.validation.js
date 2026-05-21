import { z } from "zod";

export const createSaleSchema = z.object({
  body: z.object({
    order_id: z.string().uuid("Invalid order ID").optional().nullable(),
    client_id: z.string().uuid("Invalid client ID").optional().nullable(),
    inventory_id: z.string().uuid("Invalid inventory ID"),
    warehouse_id: z.string().uuid("Invalid warehouse ID").optional().nullable(),
    medication_id: z.string().uuid("Invalid medication ID"),
    quantity_ordered: z.number().int().min(1, "Quantity must be at least 1"),
    price_per_unit: z.number().min(0, "Price cannot be negative"),
  })
});
