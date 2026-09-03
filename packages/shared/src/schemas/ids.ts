import { z } from 'zod';

export const idSchema = z.string().min(1);
export const isoDateSchema = z.string().date();
export const isoDateTimeSchema = z.string().datetime();
export const clockTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm');
