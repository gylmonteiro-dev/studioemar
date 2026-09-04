'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { AvailabilityBadge } from '@/components/student/availability-badge';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  addDays,
  clockTime,
  formatDateHeading,
  formatWeekRange,
  isInWeek,
  spotsLeft,
  startOfWeekMonday,
} from '@/lib/format';
import { getMockNow, useStudioMock } from '@/lib/mock-api';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export default function TreinadorAgendaPage() {
  const { timeSlots, bookings, users } = useStudioMock();
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeekMonday(getMockNow().toISOString()),
  );

  const slots = useMemo(
    () =>
      timeSlots
        .filter((slot) => isInWeek(slot.startsAt, weekStart))
        .slice()
        .sort(
          (left, right) =>
            new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
        ),
    [timeSlots, weekStart],
  );

  return (
    <PageCanvas>
      <section className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Agenda</h1>
          <p className="mt-1 text-muted-foreground">
            Horários da semana e quem está em cada aula.
          </p>
        </div>
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
      </section>

      <section className="flex flex-col gap-4">
        {slots.length === 0 ? (
          <p className="text-muted-foreground">Nenhum horário nesta semana.</p>
        ) : (
          slots.map((slot) => {
            const participants = bookings
              .filter(
                (booking) =>
                  booking.timeSlotId === slot.id && booking.status === 'CONFIRMED',
              )
              .map((booking) => users.find((user) => user.id === booking.studentId)?.name)
              .filter((name): name is string => Boolean(name));

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
    </PageCanvas>
  );
}
