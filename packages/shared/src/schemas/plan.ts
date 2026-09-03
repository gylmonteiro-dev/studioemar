import { z } from 'zod';
import { weekdaySchema } from './enums.js';
import { clockTimeSchema, idSchema } from './ids.js';

export const planSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  weeklyFrequency: z.number().int().min(1).max(7),
});
export type Plan = z.infer<typeof planSchema>;

export const recurringSlotSchema = z.object({
  id: idSchema,
  planId: idSchema,
  weekday: weekdaySchema,
  time: clockTimeSchema,
});
export type RecurringSlot = z.infer<typeof recurringSlotSchema>;
