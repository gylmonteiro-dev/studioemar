'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageLoadState } from '@/components/ui/load-state';
import { SelectField } from '@/components/ui/select-field';
import { useToast } from '@/components/ui/toast';
import {
  createPlan,
  deletePlan,
  listPlans,
  updatePlan,
} from '@/lib/api';
import { useAsync } from '@/lib/use-async';
import {
  monthlyClassCount,
  monthlyTrainingHours,
  type Plan,
} from '@studioemar/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do plano').max(80),
  weeklyFrequency: z.coerce.number().int().min(1).max(7),
  sessionHours: z.coerce
    .number()
    .min(0.5, 'A aula deve durar pelo menos 30 minutos')
    .max(4, 'A aula deve durar no máximo 4 horas')
    .refine((value) => Math.round(value * 2) === value * 2, 'Use intervalos de 30 minutos'),
  price: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

function emptyValues(): FormValues {
  return {
    name: '',
    weeklyFrequency: 3,
    sessionHours: 1,
    price: '',
  };
}

function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

function parsePrice(value: string | undefined): number | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatHours(value: number): string {
  return Number.isInteger(value) ? `${value}h` : `${value}h`;
}

function planPreview(weeklyFrequency: number, sessionHours: number): string {
  const minutes = hoursToMinutes(sessionHours);
  const classes = monthlyClassCount(weeklyFrequency);
  const hours = monthlyTrainingHours(weeklyFrequency, minutes);
  return `${classes} aulas/mês · ${formatHours(hours)} de treino`;
}

export function PlansPanel() {
  const { toast } = useToast();
  const { data, error, loading, reload } = useAsync(listPlans, []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyValues(),
    mode: 'onChange',
  });
  const weeklyFrequency = form.watch('weeklyFrequency');
  const sessionHours = form.watch('sessionHours');
  const preview = useMemo(
    () => planPreview(Number(weeklyFrequency) || 1, Number(sessionHours) || 1),
    [weeklyFrequency, sessionHours],
  );

  function startEdit(plan: Plan) {
    setEditingId(plan.id);
    form.reset({
      name: plan.name,
      weeklyFrequency: plan.weeklyFrequency,
      sessionHours: plan.sessionMinutes / 60,
      price: plan.price === null ? '' : String(plan.price),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    form.reset(emptyValues());
  }

  async function onSubmit(values: FormValues) {
    const price = parsePrice(values.price);
    if (values.price?.trim() && price === null) {
      form.setError('price', { message: 'Informe um preço válido' });
      return;
    }
    const payload = {
      name: values.name,
      weeklyFrequency: values.weeklyFrequency,
      sessionMinutes: hoursToMinutes(values.sessionHours),
      price,
    };
    try {
      if (editingId) {
        await updatePlan(editingId, payload);
        toast('Plano atualizado.');
      } else {
        await createPlan(payload);
        toast('Plano cadastrado.');
      }
      cancelEdit();
      reload();
    } catch (caught) {
      form.setError('name', {
        message: caught instanceof Error ? caught.message : 'Não foi possível salvar',
      });
    }
  }

  const plans = data ?? [];

  return (
    <PageLoadState loading={loading} error={error}>
      <div className="flex flex-col gap-6">
        <p className="text-muted-foreground">
          O plano guarda só as aulas por semana e a duração de cada aula. Os
          totais do mês usam 4 semanas.
        </p>
        <Card className="max-w-xl">
          <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
            <Input
              label="Nome do plano"
              placeholder="Ex.: 3x por semana"
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />
            <SelectField
              label="Aulas por semana"
              error={form.formState.errors.weeklyFrequency?.message}
              {...form.register('weeklyFrequency')}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? 'aula' : 'aulas'}
                </option>
              ))}
            </SelectField>
            <Input
              label="Horas por aula"
              type="number"
              min={0.5}
              max={4}
              step={0.5}
              error={form.formState.errors.sessionHours?.message}
              {...form.register('sessionHours')}
            />
            <Input
              label="Preço (opcional)"
              type="number"
              min={0}
              step="0.01"
              placeholder="Para o próximo módulo"
              error={form.formState.errors.price?.message}
              {...form.register('price')}
            />
            <p className="text-sm font-medium text-foreground">{preview}</p>
            <div className="flex gap-3">
              {editingId ? (
                <Button variant="ghost" type="button" className="flex-1" onClick={cancelEdit}>
                  Cancelar edição
                </Button>
              ) : null}
              <Button
                variant="cta"
                type="submit"
                className="flex-1"
                disabled={form.formState.isSubmitting}
              >
                {editingId ? 'Salvar plano' : 'Cadastrar plano'}
              </Button>
            </div>
          </form>
        </Card>
        <section className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-foreground">Planos cadastrados</h3>
          {plans.length === 0 ? (
            <p className="text-muted-foreground">Nenhum plano ainda.</p>
          ) : (
            plans.map((plan) => (
              <Card
                key={plan.id}
                className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-foreground">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {plan.weeklyFrequency}x/semana · {plan.sessionMinutes / 60}h por
                    aula · {planPreview(plan.weeklyFrequency, plan.sessionMinutes / 60)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => startEdit(plan)}>
                    Alterar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      try {
                        await deletePlan(plan.id);
                        toast('Plano excluído.');
                        if (editingId === plan.id) {
                          cancelEdit();
                        }
                        reload();
                      } catch (caught) {
                        toast(
                          caught instanceof Error
                            ? caught.message
                            : 'Não foi possível excluir',
                        );
                      }
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </Card>
            ))
          )}
        </section>
      </div>
    </PageLoadState>
  );
}
