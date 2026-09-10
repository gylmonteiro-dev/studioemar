'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SelectField } from '@/components/ui/select-field';
import { useToast } from '@/components/ui/toast';
import { listRegularAvailability, updateStudent } from '@/lib/api';
import { WEEKDAY_NAME } from '@/lib/format';
import { useAsync } from '@/lib/use-async';
import type { Plan, RegularAvailabilitySlot, User } from '@studioemar/shared';
import { useEffect, useState } from 'react';

function slotKey(slot: Pick<RegularAvailabilitySlot, 'studioHourId' | 'weekday'>) {
  return `${slot.studioHourId}:${slot.weekday}`;
}

function parseSlotKey(value: string) {
  const [studioHourId = '', weekday = ''] = value.split(':');
  return { studioHourId, weekday: weekday as RegularAvailabilitySlot['weekday'] };
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
  const [planId, setPlanId] = useState(student.planId ?? '');
  const [slotKeys, setSlotKeys] = useState(
    student.regularSlots.map((slot) => slotKey(slot)),
  );
  const [busy, setBusy] = useState(false);
  const availability = useAsync(
    () => (planId ? listRegularAvailability(planId) : Promise.resolve([])),
    [planId],
  );
  const plan = plans.find((item) => item.id === planId);
  const frequency = plan?.weeklyFrequency ?? 0;

  useEffect(() => {
    setSlotKeys((current) => {
      if (current.length === frequency) {
        return current;
      }
      return Array.from({ length: frequency }, (_, index) => current[index] ?? '');
    });
  }, [frequency]);

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
      onSaved();
    } catch (caught) {
      toast(
        caught instanceof Error ? caught.message : 'Não foi possível atualizar',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex max-w-xl flex-col gap-4 p-4">
      <h2 className="text-xl font-semibold text-foreground">
        Plano e horários
      </h2>
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
      <Button variant="cta" disabled={busy} onClick={() => void save()}>
        Salvar agenda
      </Button>
    </Card>
  );
}
