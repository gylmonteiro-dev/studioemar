'use client';

import { AuthPanel } from '@/components/auth/auth-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { recoverPassword } from '@/lib/api';
import { recoverSchema, type RecoverValues } from '@/lib/auth-schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function RecuperarSenhaPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RecoverValues>({
    resolver: zodResolver(recoverSchema),
  });

  async function onSubmit(values: RecoverValues) {
    try {
      await recoverPassword(values);
      setSent(true);
    } catch (caught) {
      setError('email', {
        message:
          caught instanceof Error
            ? caught.message
            : 'Não foi possível pedir a recuperação',
      });
    }
  }

  return (
    <AuthPanel
      title="Recuperar senha"
      description="Informe o e-mail da conta. O envio de e-mail ainda não está ativo nesta fase."
    >
      {sent ? (
        <div className="flex flex-col gap-6">
          <p className="text-white/80">
            Se o e-mail estiver cadastrado, você receberá as instruções para
            definir uma nova senha.
          </p>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-cta py-4 font-semibold text-accent-foreground"
          >
            Voltar ao login
          </Link>
        </div>
      ) : (
        <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            tone="dark"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button variant="cta" type="submit" className="w-full py-4" disabled={isSubmitting}>
            Enviar instruções
          </Button>
        </form>
      )}
      {!sent ? (
        <p className="text-center text-sm text-white/60">
          <Link href="/login" className="font-semibold text-accent hover:opacity-80">
            Voltar ao login
          </Link>
        </p>
      ) : null}
    </AuthPanel>
  );
}
