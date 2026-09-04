'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select-field';
import { useToast } from '@/components/ui/toast';
import { createStudent, useStudioMock } from '@/lib/mock-api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  email: z.string().email('Informe um e-mail válido'),
  planId: z.string().min(1, 'Escolha o plano'),
});
type Values = z.infer<typeof schema>;

export default function NovoAlunoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { plans } = useStudioMock();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { planId: plans[0]?.id ?? '' },
  });

  function onSubmit(values: Values) {
    try {
      const student = createStudent(values);
      toast(`${student.name} cadastrado. Senha no primeiro acesso.`);
      router.replace(`/treinador/alunos/${student.id}`);
    } catch (error) {
      setError('email', {
        message: error instanceof Error ? error.message : 'Não foi possível criar',
      });
    }
  }

  return (
    <PageCanvas>
      <section>
        <h1 className="text-3xl font-bold text-foreground">Novo aluno</h1>
        <p className="mt-1 text-muted-foreground">
          A conta é criada aqui. O aluno define a senha no primeiro acesso.
        </p>
      </section>

      <form className="flex max-w-lg flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Nome" error={errors.name?.message} {...register('name')} />
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <SelectField label="Plano" error={errors.planId?.message} {...register('planId')}>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </SelectField>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            type="button"
            className="flex-1"
            onClick={() => router.push('/treinador/alunos')}
          >
            Cancelar
          </Button>
          <Button variant="cta" type="submit" className="flex-1" disabled={isSubmitting}>
            Criar conta
          </Button>
        </div>
      </form>
    </PageCanvas>
  );
}
