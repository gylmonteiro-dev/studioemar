'use client';

import { ClassTypeFields } from '@/components/trainer/class-type-fields';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageLoadState } from '@/components/ui/load-state';
import { Modal } from '@/components/ui/modal';
import { SelectField } from '@/components/ui/select-field';
import { useToast } from '@/components/ui/toast';
import { canManageAccess } from '@/lib/auth-routing';
import { WEEKDAY_LABEL, WEEKDAY_NAME } from '@/lib/format';
import { ApiError } from '@/lib/api-client';
import {
  createStudioHour,
  deleteStudioHour,
  listClassTypes,
  listOperators,
  listStudioHours,
  updateStudioHour,
} from '@/lib/api';
import { useTrainer } from '@/lib/trainer-context';
import { useAsync } from '@/lib/use-async';
import {
  coincidingStudioHours,
  normalizeClockTime,
  type ClassType,
  type StudioHour,
  type Weekday,
} from '@studioemar/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const weekdays: Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const clockField = z
  .string()
  .min(1, 'Informe o horário')
  .refine((value) => normalizeClockTime(value) !== null, 'Informe hora e minuto');

const studioSchema = z.object({
  name: z.string().trim().min(1, 'Informe a identificação').max(80),
  weekdays: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])).min(
    1,
    'Escolha pelo menos um dia',
  ),
  startTime: clockField,
  endTime: clockField,
  capacity: z.coerce.number().int().positive('Informe o limite de alunos'),
  classType: z.string().min(1, 'Informe o tipo da aula'),
  trainerId: z.string().min(1, 'Escolha o treinador'),
});
type StudioValues = z.infer<typeof studioSchema>;

function formatStudioHour(hour: StudioHour): string {
  const days = hour.weekdays.map((day) => WEEKDAY_LABEL[day]).join(', ');
  return `${hour.name} · ${days} · ${hour.startTime}–${hour.endTime}`;
}

function clockValue(value: string): string {
  return normalizeClockTime(value) ?? value;
}

function emptyStudioValues(trainerId: string): StudioValues {
  return {
    name: '',
    weekdays: [],
    startTime: '07:30',
    endTime: '08:30',
    capacity: 4,
    classType: '',
    trainerId,
  };
}

export function StudioHoursPanel() {
  const trainer = useTrainer();
  const { toast } = useToast();
  const canManage = Boolean(trainer && canManageAccess(trainer.role));
  const { data, error, loading, reload } = useAsync(async () => {
    const [studioHours, operators, classTypes] = await Promise.all([
      canManage ? listStudioHours() : Promise.resolve([]),
      canManage ? listOperators({ for: 'teaching' }) : Promise.resolve([]),
      canManage ? listClassTypes() : Promise.resolve([]),
    ]);
    return { studioHours, operators, classTypes };
  }, [canManage]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [pendingOverlap, setPendingOverlap] = useState<{
    values: StudioValues;
    matches: StudioHour[];
  } | null>(null);
  const [enrolledConfirm, setEnrolledConfirm] = useState<{
    kind: 'save' | 'delete';
    hourId?: string;
    values?: StudioValues;
    message: string;
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
    defaultValues: emptyStudioValues(''),
  });

  useEffect(() => {
    if (data?.classTypes) {
      setClassTypes(data.classTypes);
    }
  }, [data?.classTypes]);

  useEffect(() => {
    if (trainers[0]?.id && !studioForm.getValues('trainerId')) {
      studioForm.setValue('trainerId', trainers[0].id);
    }
  }, [studioForm, trainers]);

  useEffect(() => {
    if (editingId) {
      return;
    }
    const current = studioForm.getValues('classType');
    if (
      current &&
      classTypes.some((type) => type.name === current)
    ) {
      return;
    }
    if (classTypes[0] && !current) {
      studioForm.setValue('classType', classTypes[0].name);
    }
  }, [classTypes, editingId, studioForm]);

  function startEdit(hour: StudioHour) {
    setEditingId(hour.id);
    studioForm.reset({
      name: hour.name,
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
    studioForm.reset(emptyStudioValues(trainers[0]?.id ?? ''));
    if (classTypes[0]) {
      studioForm.setValue('classType', classTypes[0].name);
    }
  }

  async function saveStudioHour(
    values: StudioValues,
    warned: boolean,
    confirmWithEnrolled = false,
  ) {
    const payload = {
      ...values,
      startTime: clockValue(values.startTime),
      endTime: clockValue(values.endTime),
      confirmWithEnrolled: confirmWithEnrolled || undefined,
    };
    try {
      if (editingId) {
        await updateStudioHour(editingId, payload);
        toast(warned ? 'Horário atualizado. Há turmas em paralelo neste intervalo.' : 'Horário atualizado.');
      } else {
        await createStudioHour(payload);
        toast(
          warned
            ? 'Horário criado em paralelo a outra turma. As aulas já estão na agenda.'
            : 'Horário criado. As aulas das próximas semanas já estão na agenda.',
        );
      }
      setPendingOverlap(null);
      setEnrolledConfirm(null);
      cancelEdit();
      reload();
    } catch (caught) {
      if (
        caught instanceof ApiError &&
        caught.code === 'ENROLLED_STUDENTS' &&
        !confirmWithEnrolled
      ) {
        setEnrolledConfirm({
          kind: 'save',
          values,
          message: caught.message,
        });
        return;
      }
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
        startTime: clockValue(values.startTime),
        endTime: clockValue(values.endTime),
      },
      data?.studioHours ?? [],
    );
    if (matches.length > 0) {
      setPendingOverlap({ values, matches });
      return;
    }
    await saveStudioHour(values, false);
  }

  if (!trainer) {
    return null;
  }

  if (!canManage) {
    return (
      <p className="text-muted-foreground">
        Apenas o proprietário e o administrador criam as turmas do estúdio.
      </p>
    );
  }

  const studioHours = data?.studioHours ?? [];

  return (
    <PageLoadState loading={loading} error={error}>
      <div className="flex flex-col gap-6">
        <p className="text-muted-foreground">
          Crie as turmas do estúdio com uma identificação, os dias da semana
          e o intervalo. A identificação diferencia turmas em paralelo.
        </p>

        <Card className="max-w-xl">
          <form
            className="flex flex-col gap-5"
            onSubmit={studioForm.handleSubmit(onStudioSubmit)}
          >
            <Input
              label="Identificação"
              placeholder="Ex.: Turma A, Manhã 1"
              error={studioForm.formState.errors.name?.message}
              {...studioForm.register('name')}
            />
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
                type="time"
                step={60}
                error={studioForm.formState.errors.startTime?.message}
                {...studioForm.register('startTime')}
              />
              <Input
                label="Término"
                type="time"
                step={60}
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
            <Controller
              control={studioForm.control}
              name="classType"
              render={({ field, fieldState }) => (
                <ClassTypeFields
                  value={field.value}
                  types={classTypes}
                  error={fieldState.error?.message}
                  onChange={field.onChange}
                  onCreated={(type) => {
                    setClassTypes((current) =>
                      [...current.filter((item) => item.id !== type.id), type].sort(
                        (left, right) =>
                          left.name.localeCompare(right.name, 'pt-BR'),
                      ),
                    );
                  }}
                />
              )}
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
                        if (
                          caught instanceof ApiError &&
                          caught.code === 'ENROLLED_STUDENTS'
                        ) {
                          setEnrolledConfirm({
                            kind: 'delete',
                            hourId: hour.id,
                            message: caught.message,
                          });
                          return;
                        }
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

        <Modal
          open={enrolledConfirm !== null}
          title="Alunos nesta turma"
          onClose={() => setEnrolledConfirm(null)}
        >
          <p className="text-muted-foreground">
            {enrolledConfirm?.message ??
              'Existem alunos matriculados em aulas futuras para este horário.'}{' '}
            Confirmar reorganiza ou cancela as reservas futuras, sem crédito.
          </p>
          <div className="mt-6 flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setEnrolledConfirm(null)}
            >
              Voltar
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={async () => {
                if (!enrolledConfirm) {
                  return;
                }
                if (enrolledConfirm.kind === 'delete' && enrolledConfirm.hourId) {
                  try {
                    await deleteStudioHour(enrolledConfirm.hourId, true);
                    toast('Horário excluído.');
                    if (editingId === enrolledConfirm.hourId) {
                      cancelEdit();
                    }
                    setEnrolledConfirm(null);
                    reload();
                  } catch (caught) {
                    toast(
                      caught instanceof Error
                        ? caught.message
                        : 'Não foi possível excluir',
                    );
                  }
                  return;
                }
                if (enrolledConfirm.values) {
                  await saveStudioHour(enrolledConfirm.values, true, true);
                }
              }}
            >
              Confirmar mesmo assim
            </Button>
          </div>
        </Modal>
      </div>
    </PageLoadState>
  );
}
