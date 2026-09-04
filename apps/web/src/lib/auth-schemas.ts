import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe a senha'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const firstAccessSchema = z
  .object({
    email: z.string().email('Informe um e-mail válido'),
    password: z.string().min(6, 'Mínimo de 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirme a senha'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });
export type FirstAccessValues = z.infer<typeof firstAccessSchema>;

export const recoverSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
});
export type RecoverValues = z.infer<typeof recoverSchema>;
