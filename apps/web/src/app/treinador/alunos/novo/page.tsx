'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoadState } from '@/components/ui/load-state';
import { SelectField } from '@/components/ui/select-field';
import { useToast } from '@/components/ui/toast';
import {
  createStudent,
  listOperators,
  listPlans,
  listRegularAvailability,
} from '@/lib/api';
import { canManageAccess } from '@/lib/auth-routing';
import { formatCpf, WEEKDAY_NAME } from '@/lib/format';
import { useTrainer } from '@/lib/trainer-context';
import { useAsync } from '@/lib/use-async';
import { isValidCpf, type RegularAvailabilitySlot } from '@studioemar/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  name: z.string().trim().min(1, 'Informe o nome completo'),
  cpf: z
    .string()
    .min(1, 'Informe o CPF')
    .refine((value) => isValidCpf(value), 'Informe um CPF válido'),
  email: z.string().email('Informe um e-mail válido'),
  planId: z.string().min(1, 'Escolha o plano'),
  trainerIds: z.array(z.string()),
  slotKeys: z.array(z.string().min(1, 'Escolha o horário')),
});
type Values = z.infer<typeof schema>;

function slotKey(slot: Pick<RegularAvailabilitySlot, 'studioHourId' | 'weekday'>) {
  return `${slot.studioHourId}:${slot.weekday}`;
}

function parseSlotKey(value: string) {
  const [studioHourId, weekday] = value.split(':');
  return { studioHourId, weekday };
}

function slotLabel(slot: RegularAvailabilitySlot) {
  const vagas =
    slot.remainingSpots === 1
      ? '1 vaga'
      : `${slot.remainingSpots} vagas`;
  return `${WEEKDAY_NAME[slot.weekday]} · ${slot.name} · ${slot.startTime}–${slot.endTime} (${vagas})`;
}

export default function NovoAlunoPage() {
  const router = useRouter();
  const actor = useTrainer();
  const { toast } = useToast();
  const { data, error, loading } = useAsync(async () => {
    const [plans, operators] = await Promise.all([
      listPlans(),
      actor && canManageAccess(actor.role)
        ? listOperators()
        : Promise.resolve([]),
    ]);
    return { plans, operators };
  }, [actor?.role]);
  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { planId: '', trainerIds: [], slotKeys: [] },
  });
  const planId = useWatch({ control, name: 'planId' });
  const slotKeys = useWatch({ control, name: 'slotKeys' }) ?? [];
  const selectedPlan = data?.plans.find((plan) => plan.id === planId);
  const frequency = selectedPlan?.weeklyFrequency ?? 0;
  const availability = useAsync(async () => {
    if (!planId) {
      return [];
    }
    return listRegularAvailability(planId);
  }, [planId]);

  useEffect(() => {
    if (data?.plans[0]?.id && !planId) {
      setValue('planId', data.plans[0].id);
    }
  }, [data, planId, setValue]);

  useEffect(() => {
    setValue('slotKeys', Array.from({ length: frequency }, () => ''));
  }, [frequency, planId, setValue]);

  const uniqueWeekdays = new Set(
    (availability.data ?? []).map((slot) => slot.weekday),
  ).size;
  const notEnoughSlots = frequency > 0 && uniqueWeekdays < frequency;

  async function onSubmit(values: Values) {
    if (actor && canManageAccess(actor.role) && values.trainerIds.length === 0) {
      setError('trainerIds', { message: 'Informe pelo menos um professor' });
      return;
    }
    try {
      const student = await createStudent({
        name: values.name,
        email: values.email,
        cpf: values.cpf,
        planId: values.planId,
        trainerIds: values.trainerIds,
        regularSlots: values.slotKeys.map((key) => {
          const parsed = parseSlotKey(key);
          return {
            studioHourId: parsed.studioHourId ?? '',
            weekday: parsed.weekday as RegularAvailabilitySlot['weekday'],
          };
        }),
      });
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
          <Input
            label="Nome completo"
            error={errors.name?.message}
            {...register('name')}
          />
          <Controller
            name="cpf"
            control={control}
            render={({ field }) => (
              <Input
                label="CPF"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                error={errors.cpf?.message}
                value={formatCpf(field.value ?? '')}
                onChange={(event) => field.onChange(event.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
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
                {plan.name} · {plan.weeklyFrequency}x por semana
              </option>
            ))}
          </SelectField>

          {frequency > 0 ? (
            <fieldset className="flex flex-col gap-4">
              <legend className="text-sm font-medium text-foreground">
                Dias e horários ({frequency} conforme o plano)
              </legend>
              {availability.loading ? (
                <p className="text-sm text-muted-foreground">Carregando horários…</p>
              ) : availability.error ? (
                <p className="text-sm text-danger">{availability.error}</p>
              ) : notEnoughSlots ? (
                <p className="text-sm text-danger">
                  Não há {frequency} dias com vaga neste plano. Cadastre ou libere
                  horários em Ajustes.
                </p>
              ) : (
                slotKeys.map((selected, index) => {
                  const selectedWeekdays = new Set(
                    slotKeys
                      .filter((_, current) => current !== index)
                      .map((key) => parseSlotKey(key).weekday)
                      .filter(Boolean),
                  );
                  const options = (availability.data ?? []).filter(
                    (slot) =>
                      !selectedWeekdays.has(slot.weekday) ||
                      slotKey(slot) === selected,
                  );
                  return (
                    <SelectField
                      key={`aula-${index}`}
                      label={`Aula ${index + 1}`}
                      error={errors.slotKeys?.[index]?.message}
                      value={selected}
                      onChange={(event) => {
                        const next = [...slotKeys];
                        next[index] = event.target.value;
                        setValue('slotKeys', next, { shouldValidate: true });
                      }}
                    >
                      <option value="">Selecione o dia e o horário</option>
                      {options.map((slot) => (
                        <option key={slotKey(slot)} value={slotKey(slot)}>
                          {slotLabel(slot)}
                        </option>
                      ))}
                    </SelectField>
                  );
                })
              )}
            </fieldset>
          ) : null}

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
              {errors.trainerIds?.message ? (
                <p className="text-sm text-danger">{errors.trainerIds.message}</p>
              ) : null}
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
            <Button
              variant="cta"
              type="submit"
              className="flex-1"
              disabled={isSubmitting || notEnoughSlots}
            >
              Criar conta
            </Button>
          </div>
        </form>
      </PageCanvas>
    </PageLoadState>
  );
}
