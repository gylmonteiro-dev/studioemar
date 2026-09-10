import { z } from 'zod';
import { isValidCpf } from '../rules/cpf.js';
import { userSchema } from './user.js';

export const loginRequestSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Informe o e-mail ou o CPF')
    .superRefine((value, ctx) => {
      if (value.includes('@')) {
        if (!z.string().email().safeParse(value).success) {
          ctx.addIssue({ code: 'custom', message: 'Informe um e-mail válido' });
        }
        return;
      }
      if (!isValidCpf(value)) {
        ctx.addIssue({ code: 'custom', message: 'Informe um CPF válido' });
      }
    }),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const firstAccessRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });
export type FirstAccessRequest = z.infer<typeof firstAccessRequestSchema>;

export const recoverRequestSchema = z.object({
  email: z.string().email(),
});
export type RecoverRequest = z.infer<typeof recoverRequestSchema>;

export const resetPasswordRequestSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

export const authSessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int().positive(),
  user: userSchema,
});
export type AuthSession = z.infer<typeof authSessionSchema>;

export const recoverAcceptedSchema = z.object({
  ok: z.literal(true),
});
export type RecoverAccepted = z.infer<typeof recoverAcceptedSchema>;
