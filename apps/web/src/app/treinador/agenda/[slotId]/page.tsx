'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { AvailabilityBadge } from '@/components/student/availability-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { clockTime, formatDateHeading, spotsLeft } from '@/lib/format';
import { trainerCancelBooking, useStudioMock } from '@/lib/mock-api';
import { useTrainer } from '@/lib/trainer-context';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function TreinadorSlotPage() {
  const trainer = useTrainer();
  const { slotId } = useParams<{ slotId: string }>();
  const { toast } = useToast();
  const { timeSlots, bookings, users, waitlist } = useStudioMock();
  const [cancelId, setCancelId] = useState<string | null>(null);

  const slot = timeSlots.find((item) => item.id === slotId);
  if (!trainer || !slot) {
    return (
      <PageCanvas>
        <p className="text-muted-foreground">Horário não encontrado.</p>
        <Link href="/treinador/agenda" className="text-accent">
          Voltar à agenda
        </Link>
      </PageCanvas>
    );
  }

  const participants = bookings
    .filter((booking) => booking.timeSlotId === slot.id)
    .slice()
    .sort((left, right) => left.status.localeCompare(right.status));

  const queue = waitlist
    .filter((entry) => entry.timeSlotId === slot.id && entry.status === 'WAITING')
    .slice()
    .sort((left, right) => left.position - right.position);

  return (
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
          participants.map((booking) => {
            const student = users.find((user) => user.id === booking.studentId);
            return (
              <Card
                key={booking.id}
                className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {student?.name ?? booking.studentId}
                  </p>
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
            );
          })
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-foreground">Lista de espera</h2>
        {queue.length === 0 ? (
          <p className="text-muted-foreground">Fila vazia.</p>
        ) : (
          queue.map((entry) => {
            const student = users.find((user) => user.id === entry.studentId);
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
            onClick={() => {
              if (!cancelId) {
                return;
              }
              trainerCancelBooking(cancelId);
              toast('Aula cancelada. Crédito gerado.');
              setCancelId(null);
            }}
          >
            Cancelar e gerar crédito
          </Button>
        </div>
      </Modal>
    </PageCanvas>
  );
}
