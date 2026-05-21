import { z } from "zod";

export const registerClientSchema = z.object({
  body: z.object({
    client_name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be valid"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
});

export const registerPharmacySchema = z.object({
  body: z.object({
    pharm_name: z.string().min(2, "Pharmacy name is required"),
    phone: z.string().min(10, "Phone number must be valid"),
    address: z.string().min(5, "Address is required"),
    area: z.string().min(2, "Area is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  })
});
