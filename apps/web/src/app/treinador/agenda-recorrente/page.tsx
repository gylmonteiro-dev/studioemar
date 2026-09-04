'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageLoadState } from '@/components/ui/load-state';
import { SelectField } from '@/components/ui/select-field';
import { useToast } from '@/components/ui/toast';
import { WEEKDAY_LABEL } from '@/lib/format';
import {
  addRecurringSlot,
  listPlans,
  listRecurringSlots,
  removeRecurringSlot,
} from '@/lib/api';
import { useAsync } from '@/lib/use-async';
import type { Weekday } from '@studioemar/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const weekdays: Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const schema = z.object({
  planId: z.string().min(1, 'Escolha o plano'),
  weekday: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm'),
});
type Values = z.infer<typeof schema>;

export default function AgendaRecorrentePage() {
  const { toast } = useToast();
  const { data, error, loading, reload } = useAsync(async () => {
    const [plans, recurringSlots] = await Promise.all([
      listPlans(),
      listRecurringSlots(),
    ]);
    return { plans, recurringSlots };
  }, []);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      planId: '',
      weekday: 'MON',
      time: '18:00',
    },
  });

  useEffect(() => {
    if (data?.plans[0]?.id) {
      setValue('planId', data.plans[0].id);
    }
  }, [data, setValue]);

  async function onSubmit(values: Values) {
    try {
      await addRecurringSlot(values);
      toast('Horário recorrente adicionado.');
      reset({ ...values, time: values.time });
      reload();
    } catch (caught) {
      setError('time', {
        message: caught instanceof Error ? caught.message : 'Não foi possível salvar',
      });
    }
  }

  const plans = data?.plans ?? [];
  const recurringSlots = data?.recurringSlots ?? [];

  return (
    <PageLoadState loading={loading} error={error}>
      <PageCanvas>
        <section>
          <h1 className="text-3xl font-bold text-foreground">Agenda recorrente</h1>
          <p className="mt-1 text-muted-foreground">
            Programação regular do aluno conforme o plano contratado.
          </p>
        </section>

        <Card className="max-w-xl">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
            <SelectField label="Plano" error={errors.planId?.message} {...register('planId')}>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Dia"
              error={errors.weekday?.message}
              {...register('weekday')}
            >
              {weekdays.map((weekday) => (
                <option key={weekday} value={weekday}>
                  {WEEKDAY_LABEL[weekday]}
                </option>
              ))}
            </SelectField>
            <Input label="Horário" placeholder="18:00" error={errors.time?.message} {...register('time')} />
            <Button variant="cta" type="submit" disabled={isSubmitting}>
              Adicionar horário
            </Button>
          </form>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-foreground">Horários do plano</h2>
          {recurringSlots.length === 0 ? (
            <p className="text-muted-foreground">Nenhum horário recorrente.</p>
          ) : (
            recurringSlots.map((slot) => {
              const plan = plans.find((item) => item.id === slot.planId);
              return (
                <Card
                  key={slot.id}
                  className="flex items-center justify-between p-4"
                >
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
                        toast('Horário removido da recorrência.');
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
      </PageCanvas>
    </PageLoadState>
  );
}
