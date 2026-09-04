'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { TimeSlotCard } from '@/components/student/time-slot-card';
import { Button } from '@/components/ui/button';
import { calendarDate, dayNumber, weekdayShort } from '@/lib/format';
import { availableCredits, getMockNow, useStudioMock } from '@/lib/mock-api';
import { useStudent } from '@/lib/student-context';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

export default function HorariosPage() {
  const student = useStudent();
  const { timeSlots, bookings } = useStudioMock();
  const router = useRouter();
  const now = getMockNow().getTime();

  const futureSlots = useMemo(
    () =>
      timeSlots
        .filter((slot) => new Date(slot.startsAt).getTime() >= now)
        .slice()
        .sort(
          (left, right) =>
            new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
        ),
    [timeSlots, now],
  );

  const days = useMemo(() => {
    const unique: string[] = [];
    for (const slot of futureSlots) {
      const day = calendarDate(slot.startsAt);
      if (!unique.includes(day)) {
        unique.push(day);
      }
    }
    return unique;
  }, [futureSlots]);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const activeDay = selectedDay ?? days[0] ?? null;
  const daySlots = futureSlots.filter(
    (slot) => activeDay !== null && calendarDate(slot.startsAt) === activeDay,
  );

  if (!student) {
    return null;
  }

  const credits = availableCredits(student.id).length;
  const bookedSlotIds = new Set(
    bookings
      .filter(
        (booking) =>
          booking.studentId === student.id && booking.status === 'CONFIRMED',
      )
      .map((booking) => booking.timeSlotId),
  );

  return (
    <PageCanvas>
      <section>
        <h1 className="text-3xl font-bold text-foreground">Agendar horário</h1>
        <p className="mt-1 text-muted-foreground">
          Selecione uma data e um horário disponível. {credits}{' '}
          {credits === 1 ? 'crédito' : 'créditos'} para usar nesta semana — sem teto.
        </p>
      </section>

      {days.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {days.map((day) => {
            const sample = futureSlots.find(
              (slot) => calendarDate(slot.startsAt) === day,
            );
            if (!sample) {
              return null;
            }
            const active = day === activeDay;
            return (
              <Button
                key={day}
                variant={active ? 'accent' : 'ghost'}
                className="flex min-w-[72px] flex-col py-3"
                onClick={() => {
                  setSelectedDay(day);
                }}
              >
                <span className="font-mono text-[10px] uppercase">
                  {weekdayShort(sample.startsAt)}
                </span>
                <span>{dayNumber(sample.startsAt)}</span>
              </Button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {daySlots.length === 0 ? (
          <p className="text-muted-foreground">Nenhum horário neste dia.</p>
        ) : (
          daySlots.map((slot) => (
            <TimeSlotCard
              key={slot.id}
              slot={slot}
              alreadyBooked={bookedSlotIds.has(slot.id)}
              onSchedule={() => {
                router.push(`/aluno/horarios/${slot.id}/confirmar`);
              }}
            />
          ))
        )}
      </div>
    </PageCanvas>
  );
}
