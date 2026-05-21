import { z } from "zod";

export const updatePharmacySchema = z.object({
  body: z.object({
    pharm_name: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
    address: z.string().min(5).optional(),
    area: z.string().min(2).optional(),
    discount_percent: z.number().min(0).max(100).optional(),
  }),
});
