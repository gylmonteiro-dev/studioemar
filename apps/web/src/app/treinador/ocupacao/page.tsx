'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { AvailabilityBadge } from '@/components/student/availability-badge';
import {
  HourlyOccupancyChart,
  WeekdayOccupancyList,
} from '@/components/trainer/occupancy-charts';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageLoadState } from '@/components/ui/load-state';
import { getDashboard, listTimeSlots } from '@/lib/api';
import { clockTime, formatDateHeading, spotsLeft } from '@/lib/format';
import { useAsync } from '@/lib/use-async';
import Link from 'next/link';

export default function TreinadorOcupacaoPage() {
  const { data, error, loading } = useAsync(async () => {
    const [dashboard, timeSlots] = await Promise.all([
      getDashboard(),
      listTimeSlots(),
    ]);
    return { dashboard, timeSlots };
  }, []);

  const slots = (data?.timeSlots ?? [])
    .slice()
    .sort(
      (left, right) =>
        new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    );

  return (
    <PageLoadState loading={loading} error={error}>
      {data ? (
        <PageCanvas className="max-w-6xl">
          <section>
            <h1 className="text-3xl font-bold text-foreground">Ocupação</h1>
            <p className="mt-1 text-muted-foreground">
              Vagas por horário. O aluno não vê os demais participantes.
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-foreground">
                Por horário
              </h2>
              <HourlyOccupancyChart data={data.dashboard.byHour} />
            </Card>
            <Card>
              <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-foreground">
                Por dia da semana
              </h2>
              <WeekdayOccupancyList data={data.dashboard.byWeekday} />
            </Card>
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-foreground">Horários</h2>
            {slots.map((slot) => (
              <Link key={slot.id} href={`/treinador/agenda/${slot.id}`}>
                <Card className="flex items-center justify-between p-4 transition-colors hover:border-border-hover">
                  <div>
                    <p className="font-semibold text-foreground">{slot.classType}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateHeading(slot.startsAt)} · {clockTime(slot.startsAt)} ·{' '}
                      {slot.enrolledCount}/{slot.capacity}
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
            ))}
          </section>
        </PageCanvas>
      ) : null}
    </PageLoadState>
  );
}
