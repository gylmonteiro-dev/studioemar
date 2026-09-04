'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { CANCELLATION_CREDIT_DEADLINE_HOURS } from '@studioemar/shared';
import {
  cancelBooking,
  getTrainerName,
  isEligibleToCredit,
  viewsForStudent,
  useStudioMock,
} from '@/lib/mock-api';
import {
  clockTime,
  formatDateHeading,
  formatDateLong,
} from '@/lib/format';
import { useStudent } from '@/lib/student-context';
import { useToast } from '@/components/ui/toast';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function BookingDetailPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const student = useStudent();
  useStudioMock();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lateOpen, setLateOpen] = useState(false);

  const view = student
    ? viewsForStudent(student.id).find((item) => item.booking.id === params.bookingId)
    : undefined;

  if (!student) {
    return null;
  }

  if (!view) {
    return (
      <PageCanvas>
        <p className="text-muted-foreground">Treino não encontrado.</p>
        <Link href="/aluno/agenda" className="font-semibold text-foreground">
          Voltar à agenda
        </Link>
      </PageCanvas>
    );
  }

  const { booking, slot } = view;
  const eligible = isEligibleToCredit(slot.startsAt);
  const canCancel = booking.status === 'CONFIRMED';

  function requestCancel() {
    if (eligible) {
      setSheetOpen(true);
      return;
    }
    setLateOpen(true);
  }

  function confirmCancel() {
    const result = cancelBooking(booking.id);
    setSheetOpen(false);
    setLateOpen(false);
    toast(
      result.generatedCredit
        ? 'Treino desmarcado. Você ganhou 1 crédito de reposição.'
        : 'Treino desmarcado. Sem crédito de reposição.',
    );
    router.replace('/aluno/agenda');
  }

  return (
    <PageCanvas>
      <Link
        href="/aluno/agenda"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Agenda
      </Link>

      <section>
        <h1 className="text-3xl font-bold text-foreground">Detalhes do Treino</h1>
        <p className="mt-1 text-muted-foreground">
          Acompanhe as informações da sua sessão.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <Card className="flex flex-col gap-6 md:col-span-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Modalidade
              </p>
              <h2 className="mt-1 text-xl font-semibold">{slot.classType}</h2>
            </div>
            <Badge variant={booking.status === 'CONFIRMED' ? 'success' : 'default'}>
              {booking.status === 'CONFIRMED'
                ? 'Confirmado'
                : booking.status === 'CANCELLED'
                  ? 'Cancelado'
                  : 'Falta'}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-xs uppercase text-muted-foreground">Data</p>
                <p className="font-semibold">{formatDateLong(slot.startsAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-xs uppercase text-muted-foreground">
                  Horário
                </p>
                <p className="font-semibold">
                  {clockTime(slot.startsAt)} – {clockTime(slot.endsAt)}
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <p className="font-mono text-xs uppercase text-muted-foreground">
              Treinador
            </p>
            <p className="font-semibold">{getTrainerName()}</p>
            <p className="text-sm text-muted-foreground">
              {booking.kind === 'MAKEUP' ? 'Reposição' : 'Aula regular'}
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-6 md:col-span-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Gerenciar reserva
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Você pode desmarcar este treino com direito a crédito até{' '}
              {CANCELLATION_CREDIT_DEADLINE_HOURS} horas antes do início.
            </p>
          </div>
          {canCancel ? (
            <Button variant="ghost" onClick={requestCancel}>
              Desmarcar treino
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Esta reserva já foi encerrada.</p>
          )}
        </Card>
      </div>

      <BottomSheet
        open={sheetOpen}
        title="Desmarcar treino?"
        onClose={() => {
          setSheetOpen(false);
        }}
      >
        <p className="mb-4 font-semibold text-foreground">
          {formatDateHeading(slot.startsAt)} às {clockTime(slot.startsAt)}
        </p>
        <p className="mb-6 text-sm text-foreground">
          Você está cancelando dentro do prazo permitido.{' '}
          <strong>Esta aula gerará 1 crédito de reposição.</strong>
        </p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => {
              setSheetOpen(false);
            }}
          >
            Voltar
          </Button>
          <Button variant="cta" onClick={confirmCancel}>
            Confirmar cancelamento
          </Button>
        </div>
      </BottomSheet>

      <Modal
        open={lateOpen}
        title="Atenção"
        onClose={() => {
          setLateOpen(false);
        }}
      >
        <p className="mb-6 text-center text-muted-foreground">
          O prazo para cancelamento com direito à reposição terminou. Você pode
          cancelar sua participação, porém não receberá crédito de reposição.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            variant="cta"
            className="w-full"
            onClick={() => {
              setLateOpen(false);
            }}
          >
            Manter treino
          </Button>
          <Button variant="ghost" className="w-full" onClick={confirmCancel}>
            Cancelar mesmo assim
          </Button>
        </div>
      </Modal>
    </PageCanvas>
  );
}
