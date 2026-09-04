'use client';

import { AuthPanel } from '@/components/auth/auth-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { firstAccess } from '@/lib/api';
import {
  firstAccessSchema,
  type FirstAccessValues,
} from '@/lib/auth-schemas';
import { homePathForUser } from '@/lib/auth-routing';
import { applyAuthSession } from '@/lib/session';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

export default function PrimeiroAcessoPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FirstAccessValues>({
    resolver: zodResolver(firstAccessSchema),
  });

  async function onSubmit(values: FirstAccessValues) {
    try {
      const session = await firstAccess(values);
      applyAuthSession(session);
      router.replace(homePathForUser(session.user));
    } catch (caught) {
      setError('email', {
        message:
          caught instanceof Error ? caught.message : 'Não foi possível definir a senha',
      });
    }
  }

  return (
    <AuthPanel
      title="Primeiro acesso"
      description="Defina uma senha pessoal para a conta criada pelo Studio."
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          tone="dark"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          tone="dark"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          tone="dark"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button variant="cta" type="submit" className="w-full py-4" disabled={isSubmitting}>
          Salvar senha e entrar
        </Button>
      </form>
      <p className="text-center text-sm text-white/60">
        Já definiu a senha?{' '}
        <Link href="/login" className="font-semibold text-accent hover:opacity-80">
          Entrar
        </Link>
      </p>
    </AuthPanel>
  );
}
