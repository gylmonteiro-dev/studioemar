import { z } from 'zod';
import { operatorRoleSchema, userRoleSchema } from './enums.js';
import { idSchema } from './ids.js';

export const userSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema,
  planId: idSchema.optional(),
  trainerIds: z.array(idSchema).default([]),
  mustSetPassword: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type User = z.infer<typeof userSchema>;

export const createStudentRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  planId: idSchema,
  trainerIds: z.array(idSchema).default([]),
});
export type CreateStudentRequest = z.infer<typeof createStudentRequestSchema>;

export const updateStudentTrainersRequestSchema = z.object({
  trainerIds: z.array(idSchema),
});
export type UpdateStudentTrainersRequest = z.infer<
  typeof updateStudentTrainersRequestSchema
>;

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
