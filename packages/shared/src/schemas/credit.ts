import { z } from 'zod';
import { creditSourceSchema, creditStatusSchema } from './enums.js';
import { idSchema, isoDateTimeSchema } from './ids.js';

export const creditSchema = z.object({
  id: idSchema,
  studentId: idSchema,
  source: creditSourceSchema,
  generatedAt: isoDateTimeSchema,
  originBookingId: idSchema.optional(),
  expiresAt: isoDateTimeSchema,
  status: creditStatusSchema,
  usedAt: isoDateTimeSchema.optional(),
  usedBookingId: idSchema.optional(),
});
export type Credit = z.infer<typeof creditSchema>;
