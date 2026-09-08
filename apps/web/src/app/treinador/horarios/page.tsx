'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageLoadState } from '@/components/ui/load-state';
import { Modal } from '@/components/ui/modal';
import { SelectField } from '@/components/ui/select-field';
import { useToast } from '@/components/ui/toast';
import { canManageAccess } from '@/lib/auth-routing';
import { WEEKDAY_LABEL, WEEKDAY_NAME } from '@/lib/format';
import {
  addRecurringSlot,
  createStudioHour,
  deleteStudioHour,
  listOperators,
  listPlans,
  listRecurringSlots,
  listStudioHours,
  removeRecurringSlot,
  updateStudioHour,
} from '@/lib/api';
import { useTrainer } from '@/lib/trainer-context';
import { useAsync } from '@/lib/use-async';
import {
  coincidingStudioHours,
  type StudioHour,
  type Weekday,
} from '@studioemar/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const weekdays: Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const studioSchema = z.object({
  weekdays: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])).min(
    1,
    'Escolha pelo menos um dia',
  ),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm'),
  capacity: z.coerce.number().int().positive('Informe o limite de alunos'),
  classType: z.string().min(1, 'Informe o tipo da aula'),
  trainerId: z.string().min(1, 'Escolha o treinador'),
});
type StudioValues = z.infer<typeof studioSchema>;

const planSchema = z.object({
  planId: z.string().min(1, 'Escolha o plano'),
  weekday: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm'),
});
type PlanValues = z.infer<typeof planSchema>;

function formatStudioHour(hour: StudioHour): string {
  const days = hour.weekdays.map((day) => WEEKDAY_LABEL[day]).join(', ');
  return `${days} · ${hour.startTime}–${hour.endTime}`;
}

export default function HorariosPage() {
  const trainer = useTrainer();
  const { toast } = useToast();
  const canManage = Boolean(trainer && canManageAccess(trainer.role));
  const { data, error, loading, reload } = useAsync(async () => {
    const [plans, recurringSlots, studioHours, operators] = await Promise.all([
      listPlans(),
      listRecurringSlots(),
      canManage ? listStudioHours() : Promise.resolve([]),
      canManage ? listOperators() : Promise.resolve([]),
    ]);
    return { plans, recurringSlots, studioHours, operators };
  }, [canManage]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingOverlap, setPendingOverlap] = useState<{
    values: StudioValues;
    matches: StudioHour[];
  } | null>(null);

  const trainers = useMemo(() => {
    const items = [...(data?.operators ?? [])];
    if (trainer && !items.some((item) => item.id === trainer.id)) {
      items.unshift(trainer);
    }
    return items.filter((item) => item.role !== 'STUDENT');
  }, [data?.operators, trainer]);

  const studioForm = useForm<StudioValues>({
    resolver: zodResolver(studioSchema),
    defaultValues: {
      weekdays: ['MON', 'WED', 'FRI'],
      startTime: '07:30',
      endTime: '08:30',
      capacity: 6,
      classType: 'Aula',
      trainerId: '',
    },
  });
  const planForm = useForm<PlanValues>({
    resolver: zodResolver(planSchema),
    defaultValues: { planId: '', weekday: 'MON', time: '18:00' },
  });

  useEffect(() => {
    if (trainers[0]?.id && !studioForm.getValues('trainerId')) {
      studioForm.setValue('trainerId', trainers[0].id);
    }
  }, [studioForm, trainers]);

  useEffect(() => {
    if (data?.plans[0]?.id && !planForm.getValues('planId')) {
      planForm.setValue('planId', data.plans[0].id);
    }
  }, [data, planForm]);

  function startEdit(hour: StudioHour) {
    setEditingId(hour.id);
    studioForm.reset({
      weekdays: hour.weekdays,
      startTime: hour.startTime,
      endTime: hour.endTime,
      capacity: hour.capacity,
      classType: hour.classType,
      trainerId: hour.trainerId,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setPendingOverlap(null);
    studioForm.reset({
      weekdays: ['MON', 'WED', 'FRI'],
      startTime: '07:30',
      endTime: '08:30',
      capacity: 6,
      classType: 'Aula',
      trainerId: trainers[0]?.id ?? '',
    });
  }

  async function saveStudioHour(values: StudioValues, warned: boolean) {
    try {
      if (editingId) {
        await updateStudioHour(editingId, values);
        toast(warned ? 'Horário atualizado. Há turmas em paralelo neste intervalo.' : 'Horário atualizado.');
      } else {
        await createStudioHour(values);
        toast(
          warned
            ? 'Horário criado em paralelo a outra turma. As aulas já estão na agenda.'
            : 'Horário criado. As aulas das próximas semanas já estão na agenda.',
        );
      }
      setPendingOverlap(null);
      cancelEdit();
      reload();
    } catch (caught) {
      studioForm.setError('startTime', {
        message: caught instanceof Error ? caught.message : 'Não foi possível salvar',
      });
    }
  }

  async function onStudioSubmit(values: StudioValues) {
    const matches = coincidingStudioHours(
      {
        id: editingId ?? undefined,
        weekdays: values.weekdays,
        startTime: values.startTime,
        endTime: values.endTime,
      },
      data?.studioHours ?? [],
    );
    if (matches.length > 0) {
      setPendingOverlap({ values, matches });
      return;
    }
    await saveStudioHour(values, false);
  }

  async function onPlanSubmit(values: PlanValues) {
    try {
      await addRecurringSlot(values);
      toast('Horário do plano adicionado.');
      planForm.reset({ ...values });
      reload();
    } catch (caught) {
      planForm.setError('time', {
        message: caught instanceof Error ? caught.message : 'Não foi possível salvar',
      });
    }
  }

  if (!trainer) {
    return null;
  }

  if (!canManage) {
    return (
      <PageCanvas>
        <h1 className="text-3xl font-bold text-foreground">Horários</h1>
        <p className="mt-2 text-muted-foreground">
          Apenas o proprietário e o administrador criam as turmas do estúdio.
        </p>
      </PageCanvas>
    );
  }

  const plans = data?.plans ?? [];
  const recurringSlots = data?.recurringSlots ?? [];
  const studioHours = data?.studioHours ?? [];

  return (
    <PageLoadState loading={loading} error={error}>
      <PageCanvas>
        <section>
          <h1 className="text-3xl font-bold text-foreground">Horários</h1>
          <p className="mt-1 text-muted-foreground">
            Crie as turmas do estúdio escolhendo os dias da semana e o intervalo.
            Exemplo: segunda, quarta e sexta, das 07:30 às 08:30.
          </p>
        </section>

        <Card className="max-w-xl">
          <form
            className="flex flex-col gap-5"
            onSubmit={studioForm.handleSubmit(onStudioSubmit)}
          >
            <fieldset>
              <legend className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Dias da semana
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {weekdays.map((day) => (
                  <label
                    key={day}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground"
                  >
                    <input
                      type="checkbox"
                      value={day}
                      className="h-4 w-4 accent-accent"
                      {...studioForm.register('weekdays')}
                    />
                    {WEEKDAY_NAME[day]}
                  </label>
                ))}
              </div>
              {studioForm.formState.errors.weekdays ? (
                <p className="mt-2 text-sm text-danger">
                  {studioForm.formState.errors.weekdays.message}
                </p>
              ) : null}
            </fieldset>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Início"
                placeholder="07:30"
                error={studioForm.formState.errors.startTime?.message}
                {...studioForm.register('startTime')}
              />
              <Input
                label="Término"
                placeholder="08:30"
                error={studioForm.formState.errors.endTime?.message}
                {...studioForm.register('endTime')}
              />
            </div>
            <Input
              label="Limite de alunos"
              type="number"
              min={1}
              error={studioForm.formState.errors.capacity?.message}
              {...studioForm.register('capacity')}
            />
            <Input
              label="Tipo da aula"
              error={studioForm.formState.errors.classType?.message}
              {...studioForm.register('classType')}
            />
            <SelectField
              label="Treinador"
              error={studioForm.formState.errors.trainerId?.message}
              {...studioForm.register('trainerId')}
            >
              {trainers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectField>
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
                disabled={studioForm.formState.isSubmitting}
              >
                {editingId ? 'Salvar horário' : 'Criar horário'}
              </Button>
            </div>
          </form>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-foreground">Turmas cadastradas</h2>
          {studioHours.length === 0 ? (
            <p className="text-muted-foreground">Nenhum horário do estúdio ainda.</p>
          ) : (
            studioHours.map((hour) => (
              <Card key={hour.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-foreground">{formatStudioHour(hour)}</p>
                  <p className="text-sm text-muted-foreground">
                    {hour.classType} · {hour.capacity} alunos ·{' '}
                    {trainers.find((item) => item.id === hour.trainerId)?.name ?? hour.trainerId}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => startEdit(hour)}>
                    Alterar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      try {
                        await deleteStudioHour(hour.id);
                        toast('Horário excluído.');
                        if (editingId === hour.id) {
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

        <section>
          <h2 className="text-xl font-semibold text-foreground">Agenda do plano</h2>
          <p className="mt-1 text-muted-foreground">
            Dias e horários associados ao pacote do aluno, independentes da turma.
          </p>
        </section>

        <Card className="max-w-xl">
          <form className="flex flex-col gap-5" onSubmit={planForm.handleSubmit(onPlanSubmit)}>
            <SelectField
              label="Plano"
              error={planForm.formState.errors.planId?.message}
              {...planForm.register('planId')}
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Dia"
              error={planForm.formState.errors.weekday?.message}
              {...planForm.register('weekday')}
            >
              {weekdays.map((weekday) => (
                <option key={weekday} value={weekday}>
                  {WEEKDAY_NAME[weekday]}
                </option>
              ))}
            </SelectField>
            <Input
              label="Horário"
              placeholder="18:00"
              error={planForm.formState.errors.time?.message}
              {...planForm.register('time')}
            />
            <Button variant="cta" type="submit" disabled={planForm.formState.isSubmitting}>
              Adicionar ao plano
            </Button>
          </form>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-foreground">Horários do plano</h2>
          {recurringSlots.length === 0 ? (
            <p className="text-muted-foreground">Nenhum horário de plano.</p>
          ) : (
            recurringSlots.map((slot) => {
              const plan = plans.find((item) => item.id === slot.planId);
              return (
                <Card key={slot.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      {WEEKDAY_LABEL[slot.weekday]} · {slot.time}
                    </p>
                    <p className="text-sm text-muted-foreground">{plan?.name}</p>
                  </div>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      try {
                        await removeRecurringSlot(slot.id);
                        toast('Horário removido do plano.');
                        reload();
                      } catch (caught) {
                        toast(
                          caught instanceof Error
                            ? caught.message
                            : 'Não foi possível remover',
                        );
                      }
                    }}
                  >
                    Remover
                  </Button>
                </Card>
              );
            })
          )}
        </section>

        <Modal
          open={pendingOverlap !== null}
          title="Turmas em paralelo"
          onClose={() => setPendingOverlap(null)}
        >
          <p className="text-muted-foreground">
            Esta turma coincide com outro horário já cadastrado. Você pode criar
            mesmo assim.
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {pendingOverlap?.matches.map((hour) => (
              <li key={hour.id} className="text-sm text-foreground">
                {formatStudioHour(hour)}
                {hour.classType ? ` · ${hour.classType}` : ''}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setPendingOverlap(null)}
            >
              Voltar
            </Button>
            <Button
              variant="cta"
              className="flex-1"
              onClick={() => {
                if (!pendingOverlap) {
                  return;
                }
                void saveStudioHour(pendingOverlap.values, true);
              }}
            >
              {editingId ? 'Salvar mesmo assim' : 'Criar mesmo assim'}
            </Button>
          </div>
        </Modal>
      </PageCanvas>
    </PageLoadState>
  );
}
