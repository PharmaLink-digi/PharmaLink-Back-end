import { z } from "zod";

export const createWarehouseSchema = z.object({
  body: z.object({
    warehouse_code: z.string().min(2, "Warehouse code is required"),
    phone: z.string().min(10, "Phone number is required"),
    address: z.string().min(5, "Address is required"),
    area: z.string().min(2, "Area is required"),
  })
});

export const updateWarehouseSchema = z.object({
  body: z.object({
    warehouse_code: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
    address: z.string().min(5).optional(),
    area: z.string().min(2).optional(),
  })
});
