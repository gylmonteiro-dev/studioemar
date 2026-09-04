'use client';

import { AuthPanel } from '@/components/auth/auth-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  firstAccessSchema,
  type FirstAccessValues,
} from '@/lib/auth-schemas';
import { completeFirstAccess, findStudentByEmail } from '@/lib/mock-api';
import { setSession } from '@/lib/session';
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

  function onSubmit(values: FirstAccessValues) {
    const student = findStudentByEmail(values.email);
    if (!student) {
      setError('email', { message: 'Conta não encontrada. Fale com o Studio.' });
      return;
    }
    if (!student.mustSetPassword) {
      setError('email', { message: 'Esta conta já possui senha. Faça login.' });
      return;
    }
    completeFirstAccess(student.id);
    setSession(student.id);
    router.replace('/aluno');
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
