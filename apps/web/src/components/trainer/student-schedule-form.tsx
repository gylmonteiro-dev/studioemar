'use client';

import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select-field';
import { useToast } from '@/components/ui/toast';
import { listRegularAvailability, updateStudent } from '@/lib/api';
import { WEEKDAY_NAME } from '@/lib/format';
import { useAsync } from '@/lib/use-async';
import type { Plan, RegularAvailabilitySlot, User } from '@studioemar/shared';
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';

function slotKey(slot: Pick<RegularAvailabilitySlot, 'studioHourId' | 'weekday'>) {
  return `${slot.studioHourId}:${slot.weekday}`;
}

function parseSlotKey(value: string) {
  const [studioHourId = '', weekday = ''] = value.split(':');
  return { studioHourId, weekday: weekday as RegularAvailabilitySlot['weekday'] };
}

function keysForFrequency(
  slots: User['regularSlots'],
  count: number,
) {
  const current = slots.map((slot) => slotKey(slot));
  return Array.from({ length: count }, (_, index) => current[index] ?? '');
}

function slotLabel(slot: RegularAvailabilitySlot) {
  const vagas =
    slot.remainingSpots === 1
      ? '1 vaga'
      : `${slot.remainingSpots} vagas`;
  return `${WEEKDAY_NAME[slot.weekday]} · ${slot.name} · ${slot.startTime}–${slot.endTime} (${vagas})`;
}

export function StudentScheduleForm({
  student,
  plans,
  onSaved,
}: {
  student: User;
  plans: Plan[];
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [planId, setPlanId] = useState(student.planId ?? '');
  const [slotKeys, setSlotKeys] = useState(() =>
    keysForFrequency(
      student.regularSlots,
      plans.find((item) => item.id === student.planId)?.weeklyFrequency ?? 0,
    ),
  );
  const [busy, setBusy] = useState(false);
  const availability = useAsync(
    () =>
      editing && planId
        ? listRegularAvailability(planId)
        : Promise.resolve([]),
    [planId, editing],
  );
  const plan = plans.find((item) => item.id === planId);
  const currentPlan = plans.find((item) => item.id === student.planId);
  const frequency = plan?.weeklyFrequency ?? 0;

  useEffect(() => {
    if (editing) {
      return;
    }
    setPlanId(student.planId ?? '');
    setSlotKeys(
      keysForFrequency(student.regularSlots, currentPlan?.weeklyFrequency ?? 0),
    );
  }, [student.planId, student.regularSlots, editing, currentPlan?.weeklyFrequency]);

  useEffect(() => {
    setSlotKeys((current) => {
      if (current.length === frequency) {
        return current;
      }
      return Array.from({ length: frequency }, (_, index) => current[index] ?? '');
    });
  }, [frequency]);

  function startEditing() {
    const nextPlanId = student.planId ?? '';
    const count =
      plans.find((item) => item.id === nextPlanId)?.weeklyFrequency ?? 0;
    setPlanId(nextPlanId);
    setSlotKeys(keysForFrequency(student.regularSlots, count));
    setEditing(true);
  }

  function cancelEditing() {
    const count = currentPlan?.weeklyFrequency ?? 0;
    setPlanId(student.planId ?? '');
    setSlotKeys(keysForFrequency(student.regularSlots, count));
    setEditing(false);
  }

  async function save() {
    const regularSlots = slotKeys
      .filter(Boolean)
      .map((key) => parseSlotKey(key));
    if (regularSlots.length !== frequency) {
      toast('Escolha todos os horários do plano.');
      return;
    }
    setBusy(true);
    try {
      await updateStudent(student.id, {
        planId,
        regularSlots,
      });
      toast('Agenda e plano atualizados. As aulas futuras foram reorganizadas.');
      setEditing(false);
      onSaved();
    } catch (caught) {
      toast(
        caught instanceof Error ? caught.message : 'Não foi possível atualizar',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="font-semibold text-foreground">
            {currentPlan
              ? `${currentPlan.name} · ${currentPlan.weeklyFrequency}x por semana`
              : 'Sem plano'}
          </p>
          {student.regularSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum horário definido.
            </p>
          ) : (
            student.regularSlots.map((slot) => (
              <p
                key={`${slot.studioHourId}-${slot.weekday}`}
                className="text-sm text-muted-foreground"
              >
                {WEEKDAY_NAME[slot.weekday]} · {slot.name} · {slot.startTime}–
                {slot.endTime}
              </p>
            ))
          )}
        </div>
        <Button
          variant="ghost"
          className="h-10 w-10 shrink-0 px-0 py-0"
          aria-label="Editar plano e horários"
          onClick={startEditing}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        label="Plano"
        value={planId}
        onChange={(event) => {
          setPlanId(event.target.value);
        }}
      >
        <option value="">Selecione o plano</option>
        {plans.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} · {item.weeklyFrequency}x por semana
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
                  value={selected}
                  onChange={(event) => {
                    const next = [...slotKeys];
                    next[index] = event.target.value;
                    setSlotKeys(next);
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
      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={cancelEditing}>
          Cancelar
        </Button>
        <Button variant="cta" className="flex-1" disabled={busy} onClick={() => void save()}>
          Salvar agenda
        </Button>
      </div>
    </div>
  );
}
