'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { WeekSwitcher } from '@/components/student/week-switcher';
import { WorkoutCard } from '@/components/student/workout-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLoadState } from '@/components/ui/load-state';
import {
  getServerNow,
  listMyBookings,
  listMyCredits,
  listTimeSlots,
} from '@/lib/api';
import { availableCredits, upcomingConfirmed, viewsForStudent } from '@/lib/booking-views';
import {
  addDays,
  calendarDate,
  isInWeek,
  startOfWeekMonday,
} from '@/lib/format';
import { useStudent } from '@/lib/student-context';
import { useAsync } from '@/lib/use-async';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export default function AlunoHomePage() {
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
    const [bookings, credits, weekSlots, horizonSlots] = await Promise.all([
      listMyBookings(),
      listMyCredits(),
      listTimeSlots({ from, to }),
      listTimeSlots(),
    ]);
    return { bookings, credits, weekSlots, horizonSlots, now, weekStart };
  }, [weekOffset]);

  if (!student) {
    return null;
  }

  const weekStart =
    data?.weekStart ??
    addDays(
      startOfWeekMonday((data?.now ?? new Date(0)).toISOString()),
      weekOffset * 7,
    );

  return (
    <PageLoadState loading={loading} error={error}>
      {data ? (
        <PageCanvas>
          <section>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
              Olá, {student.name}
            </h1>
            <p className="mt-2 text-muted-foreground">Pronto para o treino?</p>
          </section>

          <HomeContent
            bookings={data.bookings}
            weekSlots={data.weekSlots}
            horizonSlots={data.horizonSlots}
            credits={data.credits}
            studentId={student.id}
            now={data.now}
            weekStart={weekStart}
            onPrev={() => {
              setWeekOffset((offset) => offset - 1);
            }}
            onNext={() => {
              setWeekOffset((offset) => offset + 1);
            }}
          />
        </PageCanvas>
      ) : null}
    </PageLoadState>
  );
}

function HomeContent({
  bookings,
  weekSlots,
  horizonSlots,
  credits,
  studentId,
  now,
  weekStart,
  onPrev,
  onNext,
}: {
  bookings: Awaited<ReturnType<typeof listMyBookings>>;
  weekSlots: Awaited<ReturnType<typeof listTimeSlots>>;
  horizonSlots: Awaited<ReturnType<typeof listTimeSlots>>;
  credits: Awaited<ReturnType<typeof listMyCredits>>;
  studentId: string;
  now: Date;
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
}) {
  const upcoming = upcomingConfirmed(bookings, horizonSlots, studentId, now);
  const next = upcoming[0];
  const weekViews = useMemo(
    () =>
      viewsForStudent(bookings, weekSlots, studentId).filter(
        (item) =>
          item.booking.status === 'CONFIRMED' &&
          isInWeek(item.slot.startsAt, weekStart),
      ),
    [bookings, weekSlots, studentId, weekStart],
  );
  const creditCount = availableCredits(credits).length;
  const canScheduleMakeup = creditCount > 0;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
      <div className="flex flex-col gap-8 md:col-span-8">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            Seu próximo treino
          </h2>
          {next ? (
            <WorkoutCard
              featured
              href={`/aluno/agenda/${next.booking.id}`}
              startsAt={next.slot.startsAt}
              classType={next.slot.name}
            />
          ) : (
            <Card>
              <p className="text-muted-foreground">Nenhum treino confirmado à frente.</p>
            </Card>
          )}
        </section>

        <section>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Treinos da semana
            </h2>
            <WeekSwitcher weekStart={weekStart} onPrev={onPrev} onNext={onNext} />
          </div>
          <div className="flex flex-col gap-3">
            {weekViews.length === 0 ? (
              <p className="text-muted-foreground">Nenhum treino nesta semana.</p>
            ) : (
              weekViews.map((item) => (
                <WorkoutCard
                  key={item.booking.id}
                  href={`/aluno/agenda/${item.booking.id}`}
                  startsAt={item.slot.startsAt}
                  classType={item.slot.name}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <section className="md:col-span-4">
        <h2 className="mb-3 text-xl font-semibold text-foreground">Seus créditos</h2>
        <Card className="flex flex-col items-center text-center">
          <p className="text-3xl font-extrabold text-foreground">{creditCount}</p>
          <p className="mt-1 text-muted-foreground">
            {creditCount === 1 ? 'reposição disponível' : 'reposições disponíveis'}
          </p>
          {canScheduleMakeup ? (
            <Link href="/aluno/horarios" className="mt-6 w-full">
              <Button variant="ghost" className="w-full">
                Agendar reposição
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" className="mt-6 w-full" disabled>
              Agendar reposição
            </Button>
          )}
        </Card>
      </section>
    </div>
  );
}
