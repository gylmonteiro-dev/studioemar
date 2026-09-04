'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import {
  annulCredit,
  getStudent,
  listPlans,
  listStudentBookings,
  listStudentCredits,
  listTimeSlots,
} from '@/lib/api';
import { viewsForStudent } from '@/lib/booking-views';
import { creditSourceLabel, creditStatusLabel } from '@/lib/credit-copy';
import { clockTime, formatDateLong } from '@/lib/format';
import { useTrainer } from '@/lib/trainer-context';
import { useAsync } from '@/lib/use-async';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function TreinadorAlunoDetalhePage() {
  const trainer = useTrainer();
  const { studentId } = useParams<{ studentId: string }>();
  const { toast } = useToast();
  const { data, error, loading, reload } = useAsync(async () => {
    const [student, plans, bookings, credits, timeSlots] = await Promise.all([
      getStudent(studentId),
      listPlans(),
      listStudentBookings(studentId),
      listStudentCredits(studentId),
      listTimeSlots(),
    ]);
    return { student, plans, bookings, credits, timeSlots };
  }, [studentId]);
  const [annulId, setAnnulId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!trainer) {
    return null;
  }

  if (loading) {
    return (
      <PageCanvas>
        <p className="text-muted-foreground">Carregando…</p>
      </PageCanvas>
    );
  }

  if (!data) {
    return (
      <PageCanvas>
        <p className="text-muted-foreground">{error ?? 'Aluno não encontrado.'}</p>
        <Link href="/treinador/alunos" className="text-accent">
          Voltar
        </Link>
      </PageCanvas>
    );
  }

  const { student, plans, bookings, credits, timeSlots } = data;
  const plan = plans.find((item) => item.id === student.planId);
  const views = viewsForStudent(bookings, timeSlots, student.id);
  const studentCredits = credits.slice().sort(
    (left, right) =>
      new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime(),
  );

  async function confirmAnnul() {
    if (!annulId) {
      return;
    }
    setBusy(true);
    try {
      await annulCredit(annulId);
      toast('Crédito anulado.');
      setAnnulId(null);
      reload();
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Não foi possível anular');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageCanvas>
      <section>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {plan?.name ?? 'Sem plano'}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">{student.name}</h1>
        <p className="mt-1 text-muted-foreground">{student.email}</p>
        <div className="mt-3">
          {student.mustSetPassword ? (
            <Badge variant="warning">Aguardando primeiro acesso</Badge>
          ) : (
            <Badge variant="success">Ativo</Badge>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-foreground">Agenda</h2>
        {views.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma reserva.</p>
        ) : (
          views.map((item) => (
            <Card key={item.booking.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-foreground">{item.slot.classType}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateLong(item.slot.startsAt)} · {clockTime(item.slot.startsAt)}
                </p>
              </div>
              <Badge
                variant={item.booking.status === 'CONFIRMED' ? 'success' : 'danger'}
              >
                {item.booking.status === 'CONFIRMED' ? 'Confirmado' : 'Cancelado'}
              </Badge>
            </Card>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-foreground">Créditos</h2>
        {studentCredits.length === 0 ? (
          <p className="text-muted-foreground">Nenhum crédito.</p>
        ) : (
          studentCredits.map((credit) => (
            <Card
              key={credit.id}
              className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {creditSourceLabel(credit.source)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Validade {formatDateLong(credit.expiresAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
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
                {credit.status === 'AVAILABLE' ? (
                  <Button variant="danger" onClick={() => setAnnulId(credit.id)}>
                    Anular
                  </Button>
                ) : null}
              </div>
            </Card>
          ))
        )}
      </section>

      <Modal open={annulId !== null} title="Anular crédito" onClose={() => setAnnulId(null)}>
        <p className="text-muted-foreground">
          A anulação permanece no histórico. O aluno deixa de poder usar este crédito.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setAnnulId(null)}>
            Manter
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={confirmAnnul}
            disabled={busy}
          >
            Anular
          </Button>
        </div>
      </Modal>
    </PageCanvas>
  );
}
