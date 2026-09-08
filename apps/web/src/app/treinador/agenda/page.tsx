'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { AvailabilityBadge } from '@/components/student/availability-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageLoadState } from '@/components/ui/load-state';
import { Modal } from '@/components/ui/modal';
import { SelectField } from '@/components/ui/select-field';
import { useToast } from '@/components/ui/toast';
import { createTimeSlot, listOperators, listSlotBookings, listTimeSlots } from '@/lib/api';
import { canManageAccess } from '@/lib/auth-routing';
import { getClientNow } from '@/lib/clock';
import {
  addDays,
  clockTime,
  formatDateHeading,
  formatWeekRange,
  isInWeek,
  spotsLeft,
  startOfWeekMonday,
} from '@/lib/format';
import { useTrainer } from '@/lib/trainer-context';
import { useAsync } from '@/lib/use-async';
import { clockIntervalsOverlap } from '@studioemar/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

function dateInput(value: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}

export default function TreinadorAgendaPage() {
  const trainer = useTrainer();
  const { toast } = useToast();
  const canManage = Boolean(trainer && canManageAccess(trainer.role));
  const { data: timeSlots, error, loading, reload } = useAsync(listTimeSlots, []);
  const { data: operators } = useAsync(
    async () => (canManage ? listOperators() : []),
    [canManage],
  );
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeekMonday(getClientNow().toISOString()),
  );
  const [openCreate, setOpenCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [overlapAck, setOverlapAck] = useState(false);
  const [form, setForm] = useState({
    date: dateInput(getClientNow()),
    startTime: '18:00',
    endTime: '19:00',
    capacity: '6',
    classType: 'Aula',
    trainerId: '',
  });

  const trainers = useMemo(() => {
    const items = [...(operators ?? [])];
    if (trainer && !items.some((item) => item.id === trainer.id)) {
      items.unshift(trainer);
    }
    return items;
  }, [operators, trainer]);

  const slots = useMemo(
    () =>
      (timeSlots ?? [])
        .filter((slot) => isInWeek(slot.startsAt, weekStart))
        .slice()
        .sort(
          (left, right) =>
            new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
        ),
    [timeSlots, weekStart],
  );

  const slotIds = slots.map((slot) => slot.id).join(',');
  const { data: namesBySlot } = useAsync(async () => {
    if (slots.length === 0) {
      return {} as Record<string, string[]>;
    }
    const entries = await Promise.all(
      slots.map(async (slot) => {
        const participants = await listSlotBookings(slot.id);
        const names = participants
          .filter((item) => item.booking.status === 'CONFIRMED')
          .map((item) => item.student.name);
        return [slot.id, names] as const;
      }),
    );
    return Object.fromEntries(entries);
  }, [slotIds]);

  return (
    <PageLoadState loading={loading} error={error}>
      <PageCanvas>
        <section className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Agenda</h1>
            <p className="mt-1 text-muted-foreground">
              Horários da semana e quem está em cada aula.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            {canManage ? (
              <Button
                variant="cta"
                onClick={() => {
                  setForm((current) => ({
                    ...current,
                    date: dateInput(weekStart),
                    trainerId: current.trainerId || trainers[0]?.id || '',
                  }));
                  setOpenCreate(true);
                  setOverlapAck(false);
                }}
              >
                Incluir horário
              </Button>
            ) : null}
            <div className="flex items-center justify-between rounded-lg bg-muted p-1 md:w-auto">
            <Button
              variant="ghost"
              aria-label="Semana anterior"
              className="h-10 w-10 px-0 py-0"
              onClick={() => {
                setWeekStart(addDays(weekStart, -7));
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="px-4 font-semibold uppercase tracking-widest text-foreground">
              {formatWeekRange(weekStart)}
            </span>
            <Button
              variant="ghost"
              aria-label="Próxima semana"
              className="h-10 w-10 px-0 py-0"
              onClick={() => {
                setWeekStart(addDays(weekStart, 7));
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          {slots.length === 0 ? (
            <p className="text-muted-foreground">Nenhum horário nesta semana.</p>
          ) : (
            slots.map((slot) => {
              const participants = namesBySlot?.[slot.id] ?? [];
              return (
                <Link key={slot.id} href={`/treinador/agenda/${slot.id}`}>
                  <Card className="flex flex-col gap-3 p-4 transition-colors hover:border-border-hover md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        {formatDateHeading(slot.startsAt)} · {clockTime(slot.startsAt)}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {slot.classType}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {participants.length === 0
                          ? 'Sem alunos confirmados'
                          : participants.join(', ')}
                      </p>
                    </div>
                    {slot.status === 'CLOSED' ? (
                      <Badge variant="full">Fechado</Badge>
                    ) : (
                      <AvailabilityBadge
                        status={slot.status}
                        spotsLeft={spotsLeft(slot.enrolledCount, slot.capacity)}
                      />
                    )}
                  </Card>
                </Link>
              );
            })
          )}
        </section>

        <Modal
          open={openCreate}
          title="Incluir horário pontual"
          onClose={() => {
            setOpenCreate(false);
            setOverlapAck(false);
          }}
        >
          <form
            className="flex flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const overlapping = (timeSlots ?? []).filter((slot) => {
                if (slot.status === 'CLOSED') {
                  return false;
                }
                const slotDate = dateInput(new Date(slot.startsAt));
                if (slotDate !== form.date) {
                  return false;
                }
                return clockIntervalsOverlap(
                  form.startTime,
                  form.endTime,
                  clockTime(slot.startsAt),
                  clockTime(slot.endsAt),
                );
              });
              if (overlapping.length > 0 && !overlapAck) {
                setOverlapAck(true);
                return;
              }
              setBusy(true);
              try {
                await createTimeSlot({
                  date: form.date,
                  startTime: form.startTime,
                  endTime: form.endTime,
                  capacity: Number(form.capacity),
                  classType: form.classType,
                  trainerId: form.trainerId || trainers[0]?.id || '',
                });
                toast(
                  overlapping.length > 0
                    ? 'Horário incluído em paralelo a outra aula.'
                    : 'Horário incluído na agenda.',
                );
                setOpenCreate(false);
                setOverlapAck(false);
                reload();
              } catch (caught) {
                toast(
                  caught instanceof Error ? caught.message : 'Não foi possível incluir',
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <Input
              label="Data"
              type="date"
              value={form.date}
              onChange={(event) => {
                setOverlapAck(false);
                setForm((current) => ({ ...current, date: event.target.value }));
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Início"
                value={form.startTime}
                onChange={(event) => {
                  setOverlapAck(false);
                  setForm((current) => ({ ...current, startTime: event.target.value }));
                }}
              />
              <Input
                label="Término"
                value={form.endTime}
                onChange={(event) => {
                  setOverlapAck(false);
                  setForm((current) => ({ ...current, endTime: event.target.value }));
                }}
              />
            </div>
            <Input
              label="Limite de alunos"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(event) =>
                setForm((current) => ({ ...current, capacity: event.target.value }))
              }
            />
            <Input
              label="Tipo da aula"
              value={form.classType}
              onChange={(event) =>
                setForm((current) => ({ ...current, classType: event.target.value }))
              }
            />
            <SelectField
              label="Treinador"
              value={form.trainerId || trainers[0]?.id}
              onChange={(event) =>
                setForm((current) => ({ ...current, trainerId: event.target.value }))
              }
            >
              {trainers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectField>
            <Button variant="cta" type="submit" disabled={busy}>
              {overlapAck ? 'Incluir mesmo assim' : 'Salvar horário'}
            </Button>
            {overlapAck ? (
              <p className="text-sm text-muted-foreground">
                Já existe aula neste intervalo. Confirme para criar em paralelo.
              </p>
            ) : null}
          </form>
        </Modal>
      </PageCanvas>
    </PageLoadState>
  );
}
