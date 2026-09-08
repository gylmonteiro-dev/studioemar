import { z } from 'zod';
import { normalizeClockTime } from '../clock-time.js';

export const idSchema = z.string().min(1);
export const isoDateSchema = z.string().date();
export const isoDateTimeSchema = z.string().datetime();
export const clockTimeSchema = z
  .string()
  .transform((value, ctx) => {
    const normalized = normalizeClockTime(value);
    if (!normalized) {
      ctx.addIssue({ code: 'custom', message: 'Use HH:mm' });
      return z.NEVER;
    }
    return normalized;
  });
