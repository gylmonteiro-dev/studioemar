'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { ScheduleCard } from '@/components/student/schedule-card';
import { WeekSwitcher } from '@/components/student/week-switcher';
import { PageLoadState } from '@/components/ui/load-state';
import { listMyBookings, listTimeSlots, getServerNow } from '@/lib/api';
import { viewsForStudent } from '@/lib/booking-views';
import { addDays, calendarDate, isInWeek, startOfWeekMonday } from '@/lib/format';
import { useStudent } from '@/lib/student-context';
import { useAsync } from '@/lib/use-async';
import { useMemo, useState } from 'react';

export default function AgendaPage() {
  const student = useStudent();
  const [weekOffset, setWeekOffset] = useState(0);
  const { data, error, loading } = useAsync(async () => {
    const now = await getServerNow();
    const weekStart = addDays(
      startOfWeekMonday(now.toISOString()),
      weekOffset * 7,
    );
    const from = calendarDate(weekStart.toISOString());
    const to = calendarDate(addDays(weekStart, 6).toISOString());
    const [bookings, timeSlots] = await Promise.all([
      listMyBookings(),
      listTimeSlots({ from, to }),
    ]);
    return { bookings, timeSlots, now, weekStart };
  }, [weekOffset]);
  const weekStart =
    data?.weekStart ??
    addDays(
      startOfWeekMonday((data?.now ?? new Date(0)).toISOString()),
      weekOffset * 7,
    );

  const views = useMemo(() => {
    if (!student || !data) {
      return [];
    }
    return viewsForStudent(data.bookings, data.timeSlots, student.id).filter(
      (item) => isInWeek(item.slot.startsAt, weekStart),
    );
  }, [student, data, weekStart]);

  if (!student) {
    return null;
  }

  return (
    <PageLoadState loading={loading} error={error}>
      <PageCanvas>
        <section className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Agenda do Aluno
            </h1>
            <p className="mt-1 text-muted-foreground">
              Sua programação semanal de treinos.
            </p>
          </div>
          <WeekSwitcher
            weekStart={weekStart}
            onPrev={() => {
              setWeekOffset((offset) => offset - 1);
            }}
            onNext={() => {
              setWeekOffset((offset) => offset + 1);
            }}
          />
        </section>

        <section className="flex flex-col gap-4">
          {views.length === 0 ? (
            <p className="text-muted-foreground">Nenhum treino nesta semana.</p>
          ) : (
            views.map((item) => (
              <ScheduleCard
                key={item.booking.id}
                href={`/aluno/agenda/${item.booking.id}`}
                startsAt={item.slot.startsAt}
                classType={item.slot.name}
                kind={item.booking.kind}
                status={item.booking.status}
              />
            ))
          )}
        </section>
      </PageCanvas>
    </PageLoadState>
  );
}
