'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageLoadState } from '@/components/ui/load-state';
import { SelectField } from '@/components/ui/select-field';
import { useToast } from '@/components/ui/toast';
import {
  createOperator,
  listOperators,
  updateOperator,
} from '@/lib/api';
import { roleLabel } from '@/lib/auth-routing';
import { useTrainer } from '@/lib/trainer-context';
import { useAsync } from '@/lib/use-async';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  email: z.string().email('Informe um e-mail válido'),
  role: z.enum(['TRAINER', 'ADMIN']),
});
type Values = z.infer<typeof schema>;

export default function AcessosPage() {
  const actor = useTrainer();
  const { toast } = useToast();
  const { data, error, loading, reload } = useAsync(listOperators, []);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'TRAINER' },
  });

  async function onSubmit(values: Values) {
    try {
      await createOperator(values);
      reset({ name: '', email: '', role: 'TRAINER' });
      toast('Conta criada. A senha será definida no primeiro acesso.');
      reload();
    } catch (caught) {
      setError('email', {
        message:
          caught instanceof Error ? caught.message : 'Não foi possível criar',
      });
    }
  }

  return (
    <PageLoadState loading={loading} error={error}>
      <PageCanvas>
        <section>
          <h1 className="text-3xl font-bold text-foreground">
            Controle de acessos
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie as contas que operam o Studio. Proprietário e
            Administrador também operam como professor, com o mesmo
            login.
          </p>
        </section>

        <Card className="max-w-xl">
          <form
            className="flex flex-col gap-5"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Input
              label="Nome"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="E-mail"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <SelectField
              label="Papel"
              error={errors.role?.message}
              {...register('role')}
            >
              <option value="TRAINER">Professor/Treinador</option>
              {actor?.role === 'SUPERADMIN' ? (
                <option value="ADMIN">Proprietário</option>
              ) : null}
            </SelectField>
            <Button type="submit" variant="cta" disabled={isSubmitting}>
              Criar conta
            </Button>
          </form>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-foreground">Contas</h2>
          {(data ?? []).map((operator) => (
            <Card
              key={operator.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-foreground">{operator.name}</p>
                <p className="text-sm text-muted-foreground">
                  {operator.email} · {roleLabel(operator.role)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {actor?.role === 'SUPERADMIN' ? (
                  <select
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={operator.role}
                    onChange={async (event) => {
                      const role = event.target.value as 'TRAINER' | 'ADMIN';
                      try {
                        await updateOperator(operator.id, { role });
                        toast('Papel atualizado.');
                        reload();
                      } catch (caught) {
                        toast(
                          caught instanceof Error
                            ? caught.message
                            : 'Não foi possível atualizar',
                        );
                      }
                    }}
                  >
                    <option value="TRAINER">Professor/Treinador</option>
                    <option value="ADMIN">Proprietário</option>
                  </select>
                ) : null}
                <Badge variant={operator.isActive ? 'success' : 'warning'}>
                  {operator.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
                <Button
                  variant={operator.isActive ? 'danger' : 'ghost'}
                  onClick={async () => {
                    try {
                      await updateOperator(operator.id, {
                        isActive: !operator.isActive,
                      });
                      toast(
                        operator.isActive
                          ? 'Conta desativada.'
                          : 'Conta reativada.',
                      );
                      reload();
                    } catch (caught) {
                      toast(
                        caught instanceof Error
                          ? caught.message
                          : 'Não foi possível atualizar',
                      );
                    }
                  }}
                >
                  {operator.isActive ? 'Desativar' : 'Reativar'}
                </Button>
              </div>
            </Card>
          ))}
        </section>
      </PageCanvas>
    </PageLoadState>
  );
}
