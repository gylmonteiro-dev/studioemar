'use client';

import { AuthPanel } from '@/components/auth/auth-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login } from '@/lib/api';
import { ApiError } from '@/lib/api-client';
import { loginSchema, type LoginValues } from '@/lib/auth-schemas';
import { homePathForUser } from '@/lib/auth-routing';
import { applyAuthSession } from '@/lib/session';
import { formatCpf } from '@/lib/format';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

function looksLikeCpfInput(value: string): boolean {
  return value.length > 0 && !/[a-zA-Z@]/.test(value);
}

export default function LoginPage() {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
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
      setError('identifier', {
        message:
          caught instanceof Error ? caught.message : 'Não foi possível entrar',
      });
    }
  }

  return (
    <AuthPanel
      title="Bem-vindo ao Studio EMar"
      description="Acesse sua conta para continuar."
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="identifier"
          control={control}
          render={({ field }) => (
            <Input
              label="E-mail ou CPF"
              type="text"
              autoComplete="username"
              placeholder="seu@email.com ou 000.000.000-00"
              tone="dark"
              inputMode={looksLikeCpfInput(field.value) ? 'numeric' : 'email'}
              error={errors.identifier?.message}
              value={
                looksLikeCpfInput(field.value)
                  ? formatCpf(field.value)
                  : field.value
              }
              onChange={(event) => field.onChange(event.target.value)}
              onBlur={field.onBlur}
            />
          )}
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
