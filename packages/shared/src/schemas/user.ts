import { z } from 'zod';
import { userRoleSchema } from './enums.js';
import { idSchema } from './ids.js';

export const userSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema,
  planId: idSchema.optional(),
});
export type User = z.infer<typeof userSchema>;
