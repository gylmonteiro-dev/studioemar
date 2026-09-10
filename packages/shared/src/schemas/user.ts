import { z } from 'zod';
import { isValidCpf, normalizeCpf } from '../rules/cpf.js';
import { operatorRoleSchema, userRoleSchema, weekdaySchema } from './enums.js';
import { clockTimeSchema, idSchema } from './ids.js';

export const cpfSchema = z.string().transform((value, ctx) => {
  const digits = normalizeCpf(value);
  if (!isValidCpf(digits)) {
    ctx.addIssue({ code: 'custom', message: 'Informe um CPF válido' });
    return z.NEVER;
  }
  return digits;
});

export const regularSlotSelectionSchema = z.object({
  studioHourId: idSchema,
  weekday: weekdaySchema,
});
export type RegularSlotSelection = z.infer<typeof regularSlotSelectionSchema>;

export const studentRegularSlotSchema = z.object({
  studioHourId: idSchema,
  weekday: weekdaySchema,
  name: z.string().min(1),
  startTime: clockTimeSchema,
  endTime: clockTimeSchema,
  classType: z.string().min(1),
  trainerId: idSchema,
});
export type StudentRegularSlot = z.infer<typeof studentRegularSlotSchema>;

export const regularAvailabilitySlotSchema = z.object({
  studioHourId: idSchema,
  name: z.string().min(1),
  weekday: weekdaySchema,
  startTime: clockTimeSchema,
  endTime: clockTimeSchema,
  classType: z.string().min(1),
  trainerId: idSchema,
  capacity: z.number().int().positive(),
  remainingSpots: z.number().int().positive(),
});
export type RegularAvailabilitySlot = z.infer<
  typeof regularAvailabilitySlotSchema
>;

export const userSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema,
  planId: idSchema.optional(),
  cpf: z.string().length(11).optional(),
  trainerIds: z.array(idSchema).default([]),
  regularSlots: z.array(studentRegularSlotSchema).default([]),
  mustSetPassword: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type User = z.infer<typeof userSchema>;

export const createStudentRequestSchema = z
  .object({
    name: z.string().trim().min(1),
    email: z.string().email(),
    cpf: cpfSchema,
    planId: idSchema,
    trainerIds: z.array(idSchema).default([]),
    regularSlots: z.array(regularSlotSelectionSchema).min(1),
  })
  .refine(
    (value) =>
      new Set(value.regularSlots.map((slot) => slot.weekday)).size ===
      value.regularSlots.length,
    {
      message: 'Escolha dias da semana distintos',
      path: ['regularSlots'],
    },
  );
export type CreateStudentRequest = z.infer<typeof createStudentRequestSchema>;

export const updateStudentTrainersRequestSchema = z.object({
  trainerIds: z.array(idSchema),
});
export type UpdateStudentTrainersRequest = z.infer<
  typeof updateStudentTrainersRequestSchema
>;

export const updateStudentRequestSchema = z
  .object({
    isActive: z.boolean().optional(),
    planId: idSchema.optional(),
    regularSlots: z.array(regularSlotSelectionSchema).min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos uma alteração',
  })
  .refine(
    (value) =>
      !value.regularSlots ||
      new Set(value.regularSlots.map((slot) => slot.weekday)).size ===
        value.regularSlots.length,
    {
      message: 'Escolha dias da semana distintos',
      path: ['regularSlots'],
    },
  );
export type UpdateStudentRequest = z.infer<typeof updateStudentRequestSchema>;

export const listOperatorsQuerySchema = z.object({
  for: z.enum(['teaching']).optional(),
});
export type ListOperatorsQuery = z.infer<typeof listOperatorsQuerySchema>;

export const createOperatorRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: operatorRoleSchema,
});
export type CreateOperatorRequest = z.infer<typeof createOperatorRequestSchema>;

export const updateOperatorRequestSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: operatorRoleSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos uma alteração',
  });
export type UpdateOperatorRequest = z.infer<typeof updateOperatorRequestSchema>;
