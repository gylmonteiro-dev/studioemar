'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { clockTime, formatDateHeading } from '@/lib/format';
import {
  availableCredits,
  getTrainerName,
  redeemCredit,
  useStudioMock,
} from '@/lib/mock-api';
import { useStudent } from '@/lib/student-context';
import { useToast } from '@/components/ui/toast';
import { ArrowLeft, Calendar, Check } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ConfirmarReposicaoPage() {
  const params = useParams<{ slotId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const student = useStudent();
  const { timeSlots } = useStudioMock();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slot = timeSlots.find((item) => item.id === params.slotId);

  if (!student) {
    return null;
  }

  if (!slot) {
    return (
      <PageCanvas>
        <p className="text-muted-foreground">Horário não encontrado.</p>
        <Link href="/aluno/horarios">Voltar</Link>
      </PageCanvas>
    );
  }

  const credits = availableCredits(student.id).length;
  const studentId = student.id;
  const slotId = slot.id;

  function confirm() {
    try {
      redeemCredit(studentId, slotId);
      setDone(true);
      toast('Reposição marcada.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível agendar');
    }
  }

  if (done) {
    return (
      <PageCanvas className="items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-dark text-surface-dark-foreground">
          <Check className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold uppercase text-foreground">
          Treino agendado
        </h1>
        <p className="text-muted-foreground">Sua reposição foi marcada com sucesso.</p>
        <p className="rounded-full border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest">
          {formatDateHeading(slot.startsAt)} · {clockTime(slot.startsAt)}
        </p>
        <Button
          className="w-full max-w-md"
          onClick={() => {
            router.replace('/aluno/agenda');
          }}
        >
          Ver minha agenda
        </Button>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas className="max-w-xl">
      <Link
        href="/aluno/horarios"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Horários
      </Link>

      <div className="text-center">
        <h1 className="text-3xl font-bold uppercase text-foreground">
          Confirmar reposição
        </h1>
        <p className="mt-2 text-muted-foreground">
          Revise os detalhes da sua sessão de treino.
        </p>
      </div>

      <Card className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase text-muted-foreground">
              Data e hora
            </p>
            <p className="text-xl font-semibold">{formatDateHeading(slot.startsAt)}</p>
            <p className="text-xl font-semibold">{clockTime(slot.startsAt)}</p>
            <p className="text-muted-foreground">{slot.classType}</p>
          </div>
        </div>
        <div className="h-px bg-border" />
        <div>
          <p className="font-mono text-xs uppercase text-muted-foreground">
            Treinador
          </p>
          <p className="text-lg font-semibold">{getTrainerName()}</p>
        </div>
      </Card>

      <Card className="bg-muted">
        <p className="text-sm text-muted-foreground">
          Você possui <strong className="text-foreground">{credits} crédito{credits === 1 ? '' : 's'}</strong>{' '}
          disponível{credits === 1 ? '' : 'eis'}. Esta reserva utilizará{' '}
          <strong className="text-foreground">1 crédito</strong>.
        </p>
      </Card>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button variant="cta" className="w-full py-4" onClick={confirm} disabled={credits < 1}>
        Confirmar agendamento
      </Button>
      <Button
        variant="ghost"
        className="w-full py-4"
        onClick={() => {
          router.push('/aluno/horarios');
        }}
      >
        Cancelar
      </Button>
    </PageCanvas>
  );
}
