import { z } from "zod";

export const supportSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(8).max(30),
  email: z.string().trim().email().max(255),
  question: z.string().trim().min(1).max(2000),
  household_size: z.coerce.number().int().min(1).max(100),
  monthly_spend: z.coerce.number().min(0).max(100000000),
  spending_topic: z.string().trim().min(1).max(100),
  consent: z.literal(true),
});
export const messageSchema = z.object({ request_id: z.string().uuid(), body: z.string().trim().min(1).max(2000) });