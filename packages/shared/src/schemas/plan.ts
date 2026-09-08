import { z } from 'zod';
import {
  monthlyClassCount,
  monthlyTrainingHours,
  normalizePlanName,
} from '../rules/plan-metrics.js';
import { weekdaySchema } from './enums.js';
import { clockTimeSchema, idSchema } from './ids.js';

export const planNameSchema = z
  .string()
  .trim()
  .min(1, 'Informe o nome do plano')
  .max(80)
  .transform((value) => normalizePlanName(value));

export const sessionMinutesSchema = z
  .number()
  .int()
  .min(30, 'A aula deve durar pelo menos 30 minutos')
  .max(240, 'A aula deve durar no máximo 4 horas')
  .refine((value) => value % 30 === 0, 'Use intervalos de 30 minutos');

export const planPriceSchema = z.number().nonnegative().nullable();

export const planSchema = z.object({
  id: idSchema,
  name: planNameSchema,
  weeklyFrequency: z.number().int().min(1).max(7),
  sessionMinutes: sessionMinutesSchema,
  price: planPriceSchema,
  monthlyClasses: z.number().int().positive(),
  monthlyHours: z.number().nonnegative(),
});
export type Plan = z.infer<typeof planSchema>;

export const createPlanRequestSchema = z.object({
  name: planNameSchema,
  weeklyFrequency: z.number().int().min(1).max(7),
  sessionMinutes: sessionMinutesSchema.default(60),
  price: planPriceSchema.optional(),
});
export type CreatePlanRequest = z.infer<typeof createPlanRequestSchema>;

export const updatePlanRequestSchema = z.object({
  name: planNameSchema.optional(),
  weeklyFrequency: z.number().int().min(1).max(7).optional(),
  sessionMinutes: sessionMinutesSchema.optional(),
  price: planPriceSchema.optional(),
});
export type UpdatePlanRequest = z.infer<typeof updatePlanRequestSchema>;

export const recurringSlotSchema = z.object({
  id: idSchema,
  planId: idSchema,
  weekday: weekdaySchema,
  time: clockTimeSchema,
});
export type RecurringSlot = z.infer<typeof recurringSlotSchema>;

export function planMetrics(input: {
  weeklyFrequency: number;
  sessionMinutes: number;
}): { monthlyClasses: number; monthlyHours: number } {
  return {
    monthlyClasses: monthlyClassCount(input.weeklyFrequency),
    monthlyHours: monthlyTrainingHours(
      input.weeklyFrequency,
      input.sessionMinutes,
    ),
  };
}
