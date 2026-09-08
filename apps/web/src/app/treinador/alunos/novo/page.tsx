'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoadState } from '@/components/ui/load-state';
import { SelectField } from '@/components/ui/select-field';
import { useToast } from '@/components/ui/toast';
import { createStudent, listOperators, listPlans } from '@/lib/api';
import { canManageAccess } from '@/lib/auth-routing';
import { useTrainer } from '@/lib/trainer-context';
import { useAsync } from '@/lib/use-async';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  email: z.string().email('Informe um e-mail válido'),
  planId: z.string().min(1, 'Escolha o plano'),
  trainerIds: z.array(z.string()),
});
type Values = z.infer<typeof schema>;

export default function NovoAlunoPage() {
  const router = useRouter();
  const actor = useTrainer();
  const { toast } = useToast();
  const { data, error, loading } = useAsync(async () => {
    const [plans, operators] = await Promise.all([
      listPlans(),
      actor && canManageAccess(actor.role) ? listOperators() : Promise.resolve([]),
    ]);
    return { plans, operators };
  }, [actor?.role]);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { planId: '', trainerIds: [] },
  });

  useEffect(() => {
    if (data?.plans[0]?.id) {
      setValue('planId', data.plans[0].id);
    }
  }, [data, setValue]);

  async function onSubmit(values: Values) {
    try {
      const student = await createStudent(values);
      toast(`${student.name} cadastrado. Senha no primeiro acesso.`);
      router.replace(`/treinador/alunos/${student.id}`);
    } catch (caught) {
      setError('email', {
        message: caught instanceof Error ? caught.message : 'Não foi possível criar',
      });
    }
  }

  return (
    <PageLoadState loading={loading} error={error}>
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
            {(data?.plans ?? []).map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </SelectField>
          {actor && canManageAccess(actor.role) ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium text-foreground">
                Professores vinculados
              </legend>
              {(data?.operators ?? [])
                .filter((operator) => operator.isActive)
                .map((operator) => (
                  <label
                    key={operator.id}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <input
                      type="checkbox"
                      value={operator.id}
                      {...register('trainerIds')}
                    />
                    {operator.name}
                  </label>
                ))}
            </fieldset>
          ) : null}
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
    </PageLoadState>
  );
}
