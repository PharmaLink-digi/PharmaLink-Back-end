import { z } from "zod";

export const updateClientSchema = z.object({
  body: z.object({
    client_name: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
  }),
});
