'use client';

import { AuthPanel } from '@/components/auth/auth-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login } from '@/lib/api';
import { ApiError } from '@/lib/api-client';
import { loginSchema, type LoginValues } from '@/lib/auth-schemas';
import { homePathForUser } from '@/lib/auth-routing';
import { applyAuthSession } from '@/lib/session';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginValues) {
    try {
      const session = await login(values);
      applyAuthSession(session);
      router.replace(homePathForUser(session.user));
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'MUST_SET_PASSWORD') {
        setError('password', { message: caught.message });
        return;
      }
      setError('email', {
        message:
          caught instanceof Error ? caught.message : 'Não foi possível entrar',
      });
    }
  }

  return (
    <AuthPanel
      title="Bem-vindo ao Studio EMAR"
      description="Acesse sua conta para continuar."
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          tone="dark"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="flex flex-col gap-2">
          <Input
            label="Senha"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            tone="dark"
            error={errors.password?.message}
            {...register('password')}
          />
          <Link
            href="/recuperar-senha"
            className="self-end font-mono text-xs font-semibold uppercase tracking-widest text-accent hover:opacity-80"
          >
            Recuperar senha
          </Link>
        </div>
        <Button variant="cta" type="submit" className="w-full py-4" disabled={isSubmitting}>
          Entrar
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </form>
      <p className="text-center text-sm text-white/60">
        Sua conta é criada pelo Studio.{' '}
        <Link href="/primeiro-acesso" className="font-semibold text-accent hover:opacity-80">
          Primeiro acesso
        </Link>
      </p>
    </AuthPanel>
  );
}
