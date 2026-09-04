'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { AvailabilityBadge } from '@/components/student/availability-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLoadState } from '@/components/ui/load-state';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import {
  cancelBooking,
  getTimeSlot,
  listSlotBookings,
  listStudents,
  listWaitlist,
} from '@/lib/api';
import { clockTime, formatDateHeading, spotsLeft } from '@/lib/format';
import { useTrainer } from '@/lib/trainer-context';
import { useAsync } from '@/lib/use-async';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function TreinadorSlotPage() {
  const trainer = useTrainer();
  const { slotId } = useParams<{ slotId: string }>();
  const { toast } = useToast();
  const { data, error, loading, reload } = useAsync(async () => {
    const [slot, participants, waitlist, students] = await Promise.all([
      getTimeSlot(slotId),
      listSlotBookings(slotId),
      listWaitlist(slotId),
      listStudents(),
    ]);
    return { slot, participants, waitlist, students };
  }, [slotId]);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!trainer) {
    return null;
  }

  const slot = data?.slot;
  const participants = (data?.participants ?? [])
    .slice()
    .sort((left, right) => left.booking.status.localeCompare(right.booking.status));
  const studentsById = new Map(
    (data?.students ?? []).map((student) => [student.id, student]),
  );
  const queue = (data?.waitlist ?? [])
    .filter((entry) => entry.status === 'WAITING')
    .slice()
    .sort((left, right) => left.position - right.position);

  async function confirmCancel() {
    if (!cancelId) {
      return;
    }
    setBusy(true);
    try {
      await cancelBooking(cancelId);
      toast('Aula cancelada. Crédito gerado.');
      setCancelId(null);
      reload();
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Não foi possível cancelar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageLoadState loading={loading} error={error}>
      {!slot ? (
        <PageCanvas>
          <p className="text-muted-foreground">Horário não encontrado.</p>
          <Link href="/treinador/agenda" className="text-accent">
            Voltar à agenda
          </Link>
        </PageCanvas>
      ) : (
        <PageCanvas>
          <section>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {formatDateHeading(slot.startsAt)} · {clockTime(slot.startsAt)}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{slot.classType}</h1>
            <div className="mt-3">
              {slot.status === 'CLOSED' ? (
                <Badge variant="full">Fechado</Badge>
              ) : (
                <AvailabilityBadge
                  status={slot.status}
                  spotsLeft={spotsLeft(slot.enrolledCount, slot.capacity)}
                />
              )}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-foreground">Alunos</h2>
            {participants.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma reserva neste horário.</p>
            ) : (
              participants.map(({ booking, student }) => (
                <Card
                  key={booking.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.kind === 'MAKEUP' ? 'Reposição' : 'Regular'} ·{' '}
                      {booking.status === 'CONFIRMED' ? 'Confirmado' : 'Cancelado'}
                    </p>
                  </div>
                  {booking.status === 'CONFIRMED' && slot.status !== 'CLOSED' ? (
                    <Button variant="danger" onClick={() => setCancelId(booking.id)}>
                      Cancelar aula
                    </Button>
                  ) : null}
                </Card>
              ))
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-foreground">Lista de espera</h2>
            {queue.length === 0 ? (
              <p className="text-muted-foreground">Fila vazia.</p>
            ) : (
              queue.map((entry) => {
                const student = studentsById.get(entry.studentId);
                return (
                  <Card key={entry.id} className="flex items-center justify-between p-4">
                    <p className="font-semibold text-foreground">
                      {entry.position}. {student?.name ?? entry.studentId}
                    </p>
                    <Badge>FIFO</Badge>
                  </Card>
                );
              })
            )}
          </section>

          <Modal
            open={cancelId !== null}
            title="Cancelar aula do aluno"
            onClose={() => setCancelId(null)}
          >
            <p className="text-muted-foreground">
              O aluno recebe um crédito de reposição (cancelamento pelo professor).
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setCancelId(null)}>
                Manter
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={confirmCancel}
                disabled={busy}
              >
                Cancelar e gerar crédito
              </Button>
            </div>
          </Modal>
        </PageCanvas>
      )}
    </PageLoadState>
  );
}
