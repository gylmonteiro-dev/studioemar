import { z } from 'zod';
import { isoDateTimeSchema } from './ids.js';

export const healthSchema = z.object({
  status: z.literal('ok'),
  now: isoDateTimeSchema,
});

export type Health = z.infer<typeof healthSchema>;
