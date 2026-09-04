'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageLoadState } from '@/components/ui/load-state';
import { useToast } from '@/components/ui/toast';
import { createClosure, listClosures } from '@/lib/api';
import { useTrainer } from '@/lib/trainer-context';
import { useAsync } from '@/lib/use-async';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z
  .object({
    startsOn: z.string().min(1, 'Informe o início'),
    endsOn: z.string().min(1, 'Informe o fim'),
    reason: z.string().min(1, 'Informe o motivo'),
    grantsCredit: z.boolean(),
  })
  .refine((values) => values.endsOn >= values.startsOn, {
    message: 'A data final não pode ser anterior ao início',
    path: ['endsOn'],
  });
type Values = z.infer<typeof schema>;

export default function TreinadorConfiguracoesPage() {
  const trainer = useTrainer();
  const { toast } = useToast();
  const { data: closures, error, loading, reload } = useAsync(listClosures, []);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      startsOn: '2026-09-08',
      endsOn: '2026-09-08',
      reason: '',
      grantsCredit: false,
    },
  });

  if (!trainer) {
    return null;
  }

  async function onSubmit(values: Values) {
    try {
      await createClosure(values);
      toast(
        values.grantsCredit
          ? 'Fechamento criado com crédito de compensação.'
          : 'Fechamento criado. Sem crédito.',
      );
      reset({
        startsOn: values.startsOn,
        endsOn: values.endsOn,
        reason: '',
        grantsCredit: false,
      });
      reload();
    } catch (caught) {
      setError('reason', {
        message: caught instanceof Error ? caught.message : 'Não foi possível salvar',
      });
    }
  }

  const list = (closures ?? [])
    .slice()
    .sort((left, right) => right.startsOn.localeCompare(left.startsOn));

  return (
    <PageLoadState loading={loading} error={error}>
      <PageCanvas>
        <section>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="mt-1 text-muted-foreground">
            Férias e recesso são um fechamento informado aqui. Sem crédito por padrão.
          </p>
        </section>

        <Card className="max-w-xl">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Novo fechamento</h2>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
            <Input label="Início" type="date" error={errors.startsOn?.message} {...register('startsOn')} />
            <Input label="Fim" type="date" error={errors.endsOn?.message} {...register('endsOn')} />
            <Input
              label="Motivo"
              placeholder="Recesso, feriado, férias…"
              error={errors.reason?.message}
              {...register('reason')}
            />
            <label className="flex items-start gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                {...register('grantsCredit')}
              />
              <span>
                Compensar com crédito neste fechamento. Não é crédito avulso — só as
                aulas canceladas neste período.
              </span>
            </label>
            <Button variant="cta" type="submit" disabled={isSubmitting}>
              Registrar fechamento
            </Button>
          </form>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-foreground">Fechamentos</h2>
          {list.length === 0 ? (
            <p className="text-muted-foreground">Nenhum fechamento informado.</p>
          ) : (
            list.map((closure) => (
              <Card key={closure.id} className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold text-foreground">{closure.reason}</p>
                  <p className="text-sm text-muted-foreground">
                    {closure.startsOn === closure.endsOn
                      ? closure.startsOn
                      : `${closure.startsOn} — ${closure.endsOn}`}
                  </p>
                </div>
                <Badge variant={closure.grantsCredit ? 'success' : 'default'}>
                  {closure.grantsCredit ? 'Com crédito' : 'Sem crédito'}
                </Badge>
              </Card>
            ))
          )}
        </section>
      </PageCanvas>
    </PageLoadState>
  );
}
