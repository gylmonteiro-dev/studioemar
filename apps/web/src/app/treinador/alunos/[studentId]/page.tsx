'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { WeekSwitcher } from '@/components/student/week-switcher';
import { StudentScheduleForm } from '@/components/trainer/student-schedule-form';
import { AccordionSection } from '@/components/ui/accordion-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import {
  annulCredit,
  deleteStudent,
  getServerNow,
  getStudent,
  listOperators,
  listPlans,
  listStudentBookings,
  listStudentCredits,
  listTimeSlots,
  updateStudentTrainers,
  updateStudent,
} from '@/lib/api';
import { canManageAccess } from '@/lib/auth-routing';
import { viewsForStudent } from '@/lib/booking-views';
import { creditSourceLabel, creditStatusLabel } from '@/lib/credit-copy';
import {
  addDays,
  calendarDate,
  clockTime,
  formatCpf,
  formatDateLong,
  isInWeek,
  startOfWeekMonday,
  WEEKDAY_NAME,
} from '@/lib/format';
import { useTrainer } from '@/lib/trainer-context';
import { useAsync } from '@/lib/use-async';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TreinadorAlunoDetalhePage() {
  const trainer = useTrainer();
  const router = useRouter();
  const { studentId } = useParams<{ studentId: string }>();
  const { toast } = useToast();
  const [weekOffset, setWeekOffset] = useState(0);
  const { data, error, loading, reload } = useAsync(async () => {
    const now = await getServerNow();
    const weekStart = addDays(
      startOfWeekMonday(now.toISOString()),
      weekOffset * 7,
    );
    const from = calendarDate(weekStart.toISOString());
    const to = calendarDate(addDays(weekStart, 6).toISOString());
    const [student, plans, bookings, credits, timeSlots, operators] = await Promise.all([
      getStudent(studentId),
      listPlans(),
      listStudentBookings(studentId),
      listStudentCredits(studentId),
      listTimeSlots({ from, to }),
      trainer && canManageAccess(trainer.role)
        ? listOperators({ for: 'teaching' })
        : Promise.resolve([]),
    ]);
    return { student, plans, bookings, credits, timeSlots, operators, weekStart };
  }, [studentId, trainer?.role, weekOffset]);
  const [annulId, setAnnulId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [trainerIds, setTrainerIds] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'agenda-regular': true,
    agenda: true,
  });

  useEffect(() => {
    if (data?.student) {
      setTrainerIds(data.student.trainerIds);
    }
  }, [data?.student]);

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

  const { student, plans, bookings, credits, timeSlots, operators, weekStart } =
    data;
  const plan = plans.find((item) => item.id === student.planId);
  const views = viewsForStudent(bookings, timeSlots, student.id).filter((item) =>
    isInWeek(item.slot.startsAt, weekStart),
  );
  const studentCredits = credits.slice().sort(
    (left, right) =>
      new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime(),
  );

  function toggleSection(id: string) {
    setOpenSections((current) => ({ ...current, [id]: !current[id] }));
  }

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
        {student.cpf ? (
          <p className="mt-1 text-muted-foreground">CPF {formatCpf(student.cpf)}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {student.isActive === false ? (
            <Badge variant="warning">Inativo</Badge>
          ) : student.mustSetPassword ? (
            <Badge variant="warning">Aguardando primeiro acesso</Badge>
          ) : (
            <Badge variant="success">Ativo</Badge>
          )}
          {canManageAccess(trainer.role) ? (
            <>
              <Button
                variant={student.isActive === false ? 'cta' : 'danger'}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await updateStudent(student.id, {
                      isActive: student.isActive === false,
                    });
                    toast(
                      student.isActive === false
                        ? 'Aluno reativado. As aulas futuras com vaga voltam na grade.'
                        : 'Aluno inativado. As aulas futuras saíram da agenda.',
                    );
                    reload();
                  } catch (caught) {
                    toast(
                      caught instanceof Error
                        ? caught.message
                        : 'Não foi possível atualizar',
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {student.isActive === false ? 'Reativar' : 'Inativar'}
              </Button>
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => setConfirmDelete(true)}
              >
                Excluir
              </Button>
            </>
          ) : null}
        </div>
      </section>

      <AccordionSection
        id="agenda-regular"
        title="Agenda regular"
        open={Boolean(openSections['agenda-regular'])}
        onToggle={() => toggleSection('agenda-regular')}
      >
        {student.regularSlots.length === 0 ? (
          <p className="text-muted-foreground">Nenhum horário regular.</p>
        ) : (
          student.regularSlots.map((slot) => (
            <Card
              key={`${slot.studioHourId}-${slot.weekday}`}
              className="p-4"
            >
              <p className="font-semibold text-foreground">
                {WEEKDAY_NAME[slot.weekday]} · {slot.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {slot.startTime}–{slot.endTime} · {slot.classType}
              </p>
            </Card>
          ))
        )}
      </AccordionSection>

      <AccordionSection
        id="agenda"
        title="Agenda"
        open={Boolean(openSections.agenda)}
        onToggle={() => toggleSection('agenda')}
      >
        <WeekSwitcher
          weekStart={weekStart}
          onPrev={() => {
            setWeekOffset((offset) => offset - 1);
          }}
          onNext={() => {
            setWeekOffset((offset) => offset + 1);
          }}
        />
        {views.length === 0 ? (
          <p className="text-muted-foreground">Nenhum treino nesta semana.</p>
        ) : (
          views.map((item) => (
            <Card key={item.booking.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-foreground">{item.slot.name}</p>
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
      </AccordionSection>

      {canManageAccess(trainer.role) ? (
        <AccordionSection
          id="plano"
          title="Plano e horários"
          open={Boolean(openSections.plano)}
          onToggle={() => toggleSection('plano')}
        >
          <StudentScheduleForm
            student={student}
            plans={plans}
            onSaved={reload}
          />
        </AccordionSection>
      ) : null}

      <AccordionSection
        id="creditos"
        title="Créditos"
        open={Boolean(openSections.creditos)}
        onToggle={() => toggleSection('creditos')}
      >
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
      </AccordionSection>

      {canManageAccess(trainer.role) ? (
        <AccordionSection
          id="professores"
          title="Professores vinculados"
          open={Boolean(openSections.professores)}
          onToggle={() => toggleSection('professores')}
        >
          {operators
            .filter((operator) => operator.isActive)
            .map((operator) => (
              <label
                key={operator.id}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  checked={trainerIds.includes(operator.id)}
                  onChange={(event) =>
                    setTrainerIds((current) =>
                      event.target.checked
                        ? [...current, operator.id]
                        : current.filter((id) => id !== operator.id),
                    )
                  }
                />
                {operator.name}
              </label>
            ))}
          <Button
            variant="cta"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await updateStudentTrainers(student.id, trainerIds);
                toast('Vínculos atualizados.');
                reload();
              } catch (caught) {
                toast(
                  caught instanceof Error
                    ? caught.message
                    : 'Não foi possível atualizar',
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Salvar vínculos
          </Button>
        </AccordionSection>
      ) : null}

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

      <Modal
        open={confirmDelete}
        title="Excluir aluno"
        onClose={() => setConfirmDelete(false)}
      >
        <p className="text-muted-foreground">
          Apaga o cadastro de {student.name}, as reservas, os créditos e a lista
          de espera. Não dá para desfazer. Se o aluno só saiu do estúdio, use
          Inativar.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => setConfirmDelete(false)}
          >
            Manter
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await deleteStudent(student.id);
                toast('Cadastro excluído.');
                router.replace('/treinador/alunos');
              } catch (caught) {
                toast(
                  caught instanceof Error
                    ? caught.message
                    : 'Não foi possível excluir',
                );
                setBusy(false);
              }
            }}
          >
            Excluir cadastro
          </Button>
        </div>
      </Modal>
    </PageCanvas>
  );
}
