'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLoadState } from '@/components/ui/load-state';
import { listMyCredits } from '@/lib/api';
import { availableCredits } from '@/lib/booking-views';
import { creditSourceLabel, creditStatusLabel } from '@/lib/credit-copy';
import { formatDateLong } from '@/lib/format';
import { useStudent } from '@/lib/student-context';
import { useAsync } from '@/lib/use-async';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function CreditosPage() {
  const student = useStudent();
  const { data: credits, error, loading } = useAsync(listMyCredits, []);

  if (!student) {
    return null;
  }

  const mine = (credits ?? [])
    .slice()
    .sort(
      (left, right) =>
        new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime(),
    );
  const available = availableCredits(mine);
  const highlight = available[0];

  return (
    <PageLoadState loading={loading} error={error}>
      <PageCanvas>
        <section>
          <h1 className="text-3xl font-bold text-foreground">Seus Créditos</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Gerencie suas reposições e acompanhe o histórico de utilização.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <Card className="flex flex-col gap-6 md:col-span-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Saldo atual
              </p>
              <p className="mt-2 text-6xl font-extrabold tracking-tighter text-foreground">
                {available.length}
              </p>
              <p className="mt-1 text-xl font-semibold">
                {available.length === 1
                  ? 'Reposição disponível'
                  : 'Reposições disponíveis'}
              </p>
            </div>
            {highlight ? (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Origem</span>
                  <span className="text-right font-medium">
                    {creditSourceLabel(highlight.source)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Validade</span>
                  <span className="font-medium">{formatDateLong(highlight.expiresAt)}</span>
                </div>
              </div>
            ) : null}
            <Link href="/aluno/horarios" className={available.length === 0 ? 'pointer-events-none' : undefined}>
              <Button variant="cta" className="w-full md:w-auto" disabled={available.length === 0}>
                <Zap className="h-4 w-4" />
                Usar crédito
              </Button>
            </Link>
          </Card>
          <Card className="flex flex-col items-center justify-center bg-surface-dark p-8 text-center text-surface-dark-foreground md:col-span-4">
            <h2 className="text-xl font-semibold">Mantenha o ritmo</h2>
            <p className="mt-2 text-white/70">
              Agende sua reposição antes do vencimento.
            </p>
          </Card>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Histórico</h2>
          {mine.length === 0 ? (
            <p className="text-muted-foreground">Nenhum crédito registrado.</p>
          ) : (
            mine.map((credit) => (
              <Card key={credit.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-foreground">
                    {credit.status === 'USED' ? '-1 ' : '+1 '}
                    {creditSourceLabel(credit.source)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateLong(credit.generatedAt)}
                  </p>
                </div>
                <Badge
                  variant={
                    credit.status === 'AVAILABLE'
                      ? 'success'
                      : credit.status === 'ANNULLED'
                        ? 'danger'
                        : 'default'
                  }
                >
                  {creditStatusLabel(credit.status)}
                </Badge>
              </Card>
            ))
          )}
        </section>
      </PageCanvas>
    </PageLoadState>
  );
}
