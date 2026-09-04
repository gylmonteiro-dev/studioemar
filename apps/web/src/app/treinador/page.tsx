'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import {
  HourlyOccupancyChart,
  WeekdayOccupancyList,
} from '@/components/trainer/occupancy-charts';
import { Card } from '@/components/ui/card';
import { PageLoadState } from '@/components/ui/load-state';
import { getDashboard } from '@/lib/api';
import { getClientNow } from '@/lib/clock';
import { clockTime, formatDateLong } from '@/lib/format';
import { useTrainer } from '@/lib/trainer-context';
import { useAsync } from '@/lib/use-async';
import Link from 'next/link';

function greeting(iso: string): string {
  const hour = Number(clockTime(iso).slice(0, 2));
  if (hour < 12) {
    return 'Bom dia';
  }
  if (hour < 18) {
    return 'Boa tarde';
  }
  return 'Boa noite';
}

export default function TreinadorDashboardPage() {
  const trainer = useTrainer();
  const { data: dashboard, error, loading } = useAsync(getDashboard, []);

  if (!trainer) {
    return null;
  }

  const now = getClientNow().toISOString();
  const metrics = dashboard
    ? [
        { label: 'Alunos hoje', value: String(dashboard.metrics.studentsToday) },
        {
          label: 'Ocupação',
          value: `${dashboard.metrics.occupancyPercent}%`,
          featured: true,
        },
        { label: 'Vagas livres', value: String(dashboard.metrics.freeSpots) },
        {
          label: 'Cancelados',
          value: String(dashboard.metrics.cancellations),
          danger: true,
        },
        { label: 'Reposições', value: String(dashboard.metrics.makeups) },
      ]
    : [];

  return (
    <PageLoadState loading={loading} error={error}>
      {dashboard ? (
        <PageCanvas className="max-w-6xl">
          <section>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
              {greeting(now)}, {trainer.name}.
            </h1>
            <p className="mt-2 text-muted-foreground">
              Visão geral de ocupação — {formatDateLong(now)}.
            </p>
          </section>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {metrics.map((metric) => (
              <Card
                key={metric.label}
                className={
                  metric.featured
                    ? 'bg-surface-dark text-surface-dark-foreground'
                    : undefined
                }
              >
                <p
                  className={`font-mono text-xs uppercase tracking-widest ${
                    metric.featured ? 'text-white/70' : 'text-muted-foreground'
                  }`}
                >
                  {metric.label}
                </p>
                <p
                  className={`mt-2 text-3xl font-extrabold ${
                    metric.danger ? 'text-danger' : ''
                  }`}
                >
                  {metric.value}
                </p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
                <h2 className="font-mono text-xs uppercase tracking-widest text-foreground">
                  Ocupação por horário
                </h2>
                <Link
                  href="/treinador/ocupacao"
                  className="font-mono text-xs uppercase tracking-widest text-accent"
                >
                  Ver ocupação
                </Link>
              </div>
              <HourlyOccupancyChart data={dashboard.byHour} />
            </Card>
            <Card>
              <div className="mb-4 border-b border-border pb-4">
                <h2 className="font-mono text-xs uppercase tracking-widest text-foreground">
                  Ocupação da semana
                </h2>
              </div>
              <WeekdayOccupancyList data={dashboard.byWeekday} />
            </Card>
          </div>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Link href="/treinador/alunos" className="font-semibold text-accent">
              Cadastrar aluno
            </Link>
            <Link href="/treinador/agenda-recorrente" className="font-semibold text-accent">
              Agenda recorrente
            </Link>
            <Link href="/treinador/configuracoes" className="font-semibold text-accent">
              Fechamento do Studio
            </Link>
          </section>
        </PageCanvas>
      ) : null}
    </PageLoadState>
  );
}
