import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreditsService } from '../credits/credits.service';
import type { Clock } from '../common/clock';
import { StudentAccessService } from '../common/student-access.service';
import { SchedulesService } from '../schedules/schedules.service';
import { createMemoryPrisma, fixedClock } from '../test/memory-prisma';
import type { AuthUser } from '../auth/auth.types';
import { saoPauloDateTime } from '../common/calendar-date';

const NOW = '2026-09-03T15:00:00.000Z';
const plan = { id: 'plan-3x', name: '3X POR SEMANA', weeklyFrequency: 3 };
const admin: AuthUser = {
  id: 'user-admin',
  email: 'admin@studioemar.local',
  role: 'ADMIN',
};
const carlos: AuthUser = {
  id: 'user-carlos',
  email: 'carlos@studioemar.local',
  role: 'TRAINER',
};

const hourManha = {
  id: 'hour-manha',
  name: 'Manhã 1',
  weekdays: ['MON', 'WED', 'FRI'],
  startTime: '07:30',
  endTime: '08:30',
  capacity: 6,
  classType: 'AULA',
  trainerId: 'user-carlos',
};

function slot(id: string, date: string, enrolledCount = 2) {
  return {
    id,
    name: 'Manhã 1',
    startsAt: saoPauloDateTime(date, '07:30'),
    endsAt: saoPauloDateTime(date, '08:30'),
    capacity: 6,
    enrolledCount,
    status: enrolledCount >= 6 ? ('FULL' as const) : ('OPEN' as const),
    classType: 'AULA',
    trainerId: 'user-carlos',
    studioHourId: 'hour-manha',
  };
}

const regularSlots = [
  { studioHourId: 'hour-manha', weekday: 'MON' as const },
  { studioHourId: 'hour-manha', weekday: 'WED' as const },
  { studioHourId: 'hour-manha', weekday: 'FRI' as const },
];

function createPayload(
  override: Record<string, unknown> = {},
): Parameters<StudentsService['create']>[0] {
  return {
    name: ' Ana Silva ',
    email: 'Ana@studioemar.local',
    cpf: '52998224725',
    planId: 'plan-3x',
    trainerIds: ['user-carlos'],
    regularSlots,
    ...override,
  } as Parameters<StudentsService['create']>[0];
}

function createStudents(
  extra: Parameters<typeof createMemoryPrisma>[0] = {},
) {
  const { prisma, store } = createMemoryPrisma({
    plans: [plan],
    users: [
      {
        id: 'user-joao',
        name: 'João',
        email: 'joao@studioemar.local',
        role: 'STUDENT',
        planId: 'plan-3x',
        mustSetPassword: false,
        passwordHash: 'hash',
      },
      {
        id: 'user-carlos',
        name: 'Carlos',
        email: 'carlos@studioemar.local',
        role: 'TRAINER',
        planId: null,
        mustSetPassword: false,
        passwordHash: 'hash',
        isActive: true,
      },
    ],
    studioHours: [hourManha],
    timeSlots: [
      slot('slot-mon', '2026-09-07'),
      slot('slot-wed', '2026-09-09'),
      slot('slot-fri', '2026-09-11'),
    ],
    ...extra,
  });
  const clock = fixedClock(NOW) as Clock;
  const credits = new CreditsService(prisma, clock);
  return {
    students: new StudentsService(
      prisma,
      credits,
      new StudentAccessService(prisma),
      clock,
      new SchedulesService(prisma, clock),
    ),
    store,
  };
}

describe('StudentsService', () => {
  it('cria aluno com mustSetPassword, CPF, agenda e reservas REGULAR', async () => {
    const { students, store } = createStudents();
    const user = await students.create(createPayload(), admin);
    assert.equal(user.email, 'ana@studioemar.local');
    assert.equal(user.name, 'Ana Silva');
    assert.equal(user.cpf, '52998224725');
    assert.equal(user.mustSetPassword, true);
    assert.equal(user.role, 'STUDENT');
    assert.deepEqual(
      user.regularSlots.map((slot) => slot.weekday),
      ['MON', 'WED', 'FRI'],
    );
    assert.equal('passwordHash' in user, false);
    assert.equal(store.users.at(-1)?.passwordHash, null);
    assert.ok(store.bookings.length >= 3);
    assert.ok(store.bookings.every((booking) => booking.kind === 'REGULAR'));
    assert.equal(
      store.timeSlots.find((item) => item.id === 'slot-mon')?.enrolledCount,
      3,
    );
  });

  it('lista disponibilidade só onde há vaga e a duração bate com o plano', async () => {
    const { students } = createStudents({
      studioHours: [
        hourManha,
        {
          id: 'hour-90',
          name: 'Longa',
          weekdays: ['TUE'],
          startTime: '07:30',
          endTime: '09:00',
          capacity: 6,
          classType: 'AULA',
          trainerId: 'user-carlos',
        },
      ],
      timeSlots: [
        slot('slot-mon', '2026-09-07', 6),
        slot('slot-wed', '2026-09-09'),
        slot('slot-fri', '2026-09-11'),
        {
          id: 'slot-tue-90',
          name: 'Longa',
          startsAt: saoPauloDateTime('2026-09-08', '07:30'),
          endsAt: saoPauloDateTime('2026-09-08', '09:00'),
          capacity: 6,
          enrolledCount: 1,
          status: 'OPEN' as const,
          classType: 'AULA',
          trainerId: 'user-carlos',
          studioHourId: 'hour-90',
        },
      ],
    });
    const available = await students.listRegularAvailability('plan-3x');
    assert.deepEqual(
      available.map((item) => item.weekday),
      ['WED', 'FRI'],
    );
    assert.equal(
      available.every((item) => item.studioHourId === 'hour-manha'),
      true,
    );
  });

  it('recusa quantidade de dias diferente do plano', async () => {
    const { students } = createStudents();
    await assert.rejects(
      () =>
        students.create(
          createPayload({
            regularSlots: [regularSlots[0]],
          }),
          admin,
        ),
      BadRequestException,
    );
  });

  it('recusa horário lotado', async () => {
    const { students } = createStudents({
      timeSlots: [
        slot('slot-mon', '2026-09-07', 6),
        slot('slot-wed', '2026-09-09'),
        slot('slot-fri', '2026-09-11'),
      ],
    });
    await assert.rejects(
      () => students.create(createPayload(), admin),
      ConflictException,
    );
  });

  it('recusa CPF já cadastrado', async () => {
    const { students } = createStudents({
      users: [
        {
          id: 'user-joao',
          name: 'João',
          email: 'joao@studioemar.local',
          cpf: '52998224725',
          role: 'STUDENT',
          planId: 'plan-3x',
          mustSetPassword: false,
          passwordHash: 'hash',
        },
        {
          id: 'user-carlos',
          name: 'Carlos',
          email: 'carlos@studioemar.local',
          role: 'TRAINER',
          planId: null,
          mustSetPassword: false,
          passwordHash: 'hash',
          isActive: true,
        },
      ],
    });
    await assert.rejects(
      () =>
        students.create(
          createPayload({
            email: 'outra@studioemar.local',
          }),
          admin,
        ),
      ConflictException,
    );
  });

  it('recusa criar sem professor quando o ator é ADMIN', async () => {
    const { students } = createStudents();
    await assert.rejects(
      () => students.create(createPayload({ trainerIds: [] }), admin),
      BadRequestException,
    );
  });

  it('recusa e-mail já cadastrado', async () => {
    const { students } = createStudents();
    await assert.rejects(
      () =>
        students.create(
          createPayload({
            email: 'joao@studioemar.local',
            cpf: '11144477735',
          }),
          admin,
        ),
      ConflictException,
    );
  });

  it('recusa plano inexistente', async () => {
    const { students } = createStudents();
    await assert.rejects(
      () =>
        students.create(
          createPayload({
            planId: 'missing',
          }),
          admin,
        ),
      NotFoundException,
    );
  });

  it('grava plano em maiúsculas e recusa nome duplicado', async () => {
    const { students, store } = createStudents();
    const created = await students.createPlan({
      name: '  2x  manhã ',
      weeklyFrequency: 2,
      sessionMinutes: 60,
    });
    assert.equal(created.name, '2X MANHÃ');
    assert.equal(created.monthlyClasses, 8);
    assert.equal(created.monthlyHours, 8);
    assert.equal(created.price, null);
    await assert.rejects(
      () =>
        students.createPlan({
          name: '2x manhã',
          weeklyFrequency: 3,
          sessionMinutes: 60,
        }),
      ConflictException,
    );
    assert.equal(store.plans.length, 2);
  });

  it('recusa excluir plano com aluno vinculado', async () => {
    const { students } = createStudents();
    await assert.rejects(() => students.deletePlan('plan-3x'), ConflictException);
  });

  it('vincula o próprio TRAINER ao criar aluno', async () => {
    const { students } = createStudents();
    const user = await students.create(
      createPayload({ trainerIds: [] }),
      carlos,
    );
    assert.deepEqual(user.trainerIds, ['user-carlos']);
  });

  it('inativar aluno cancela só as reservas futuras', async () => {
    const { students, store } = createStudents({
      timeSlots: [
        slot('slot-past', '2026-09-02'),
        slot('slot-mon', '2026-09-07'),
        slot('slot-wed', '2026-09-09'),
        slot('slot-fri', '2026-09-11'),
      ],
      bookings: [
        {
          id: 'booking-past',
          studentId: 'user-joao',
          timeSlotId: 'slot-past',
          kind: 'REGULAR',
          status: 'CONFIRMED',
        },
        {
          id: 'booking-future',
          studentId: 'user-joao',
          timeSlotId: 'slot-mon',
          kind: 'REGULAR',
          status: 'CONFIRMED',
        },
      ],
      studentRegularSlots: [
        {
          id: 'regular-joao',
          studentId: 'user-joao',
          studioHourId: 'hour-manha',
          weekday: 'MON',
        },
      ],
    });
    store.timeSlots.find((item) => item.id === 'slot-past')!.enrolledCount = 1;
    store.timeSlots.find((item) => item.id === 'slot-mon')!.enrolledCount = 3;
    const updated = await students.updateStudent(
      'user-joao',
      { isActive: false },
      admin,
    );
    assert.equal(updated.isActive, false);
    assert.equal(
      store.bookings.find((item) => item.id === 'booking-past')?.status,
      'CONFIRMED',
    );
    assert.equal(
      store.bookings.find((item) => item.id === 'booking-future')?.status,
      'CANCELLED',
    );
    assert.equal(
      store.timeSlots.find((item) => item.id === 'slot-mon')?.enrolledCount,
      2,
    );
  });

  it('exclui aluno e devolve as vagas das reservas confirmadas', async () => {
    const { students, store } = createStudents({
      timeSlots: [
        slot('slot-past', '2026-09-02', 1),
        slot('slot-mon', '2026-09-07', 3),
      ],
      bookings: [
        {
          id: 'booking-past',
          studentId: 'user-joao',
          timeSlotId: 'slot-past',
          kind: 'REGULAR',
          status: 'CONFIRMED',
        },
        {
          id: 'booking-future',
          studentId: 'user-joao',
          timeSlotId: 'slot-mon',
          kind: 'REGULAR',
          status: 'CONFIRMED',
        },
        {
          id: 'booking-cancelled',
          studentId: 'user-joao',
          timeSlotId: 'slot-mon',
          kind: 'MAKEUP',
          status: 'CANCELLED',
        },
      ],
      cancellations: [
        {
          id: 'cancel-1',
          bookingId: 'booking-cancelled',
          cancelledAt: new Date(NOW),
          cancelledBy: 'STUDENT',
          generatedCredit: true,
          creditId: 'credit-1',
        },
      ],
      credits: [
        {
          id: 'credit-1',
          studentId: 'user-joao',
          source: 'CANCELLATION',
          generatedAt: new Date(NOW),
          originBookingId: 'booking-cancelled',
          originClosureId: null,
          expiresAt: new Date('2026-10-03T15:00:00.000Z'),
          status: 'AVAILABLE',
          usedAt: null,
          usedBookingId: null,
          annulledAt: null,
          annulledByUserId: null,
        },
      ],
      waitlist: [
        {
          id: 'wait-1',
          timeSlotId: 'slot-mon',
          studentId: 'user-joao',
          position: 1,
          enqueuedAt: new Date(NOW),
          status: 'WAITING',
        },
      ],
      studentTrainers: [{ studentId: 'user-joao', trainerId: 'user-carlos' }],
      studentRegularSlots: [
        {
          id: 'regular-joao',
          studentId: 'user-joao',
          studioHourId: 'hour-manha',
          weekday: 'MON',
        },
      ],
    });

    await students.remove('user-joao', admin);

    assert.equal(
      store.users.find((item) => item.id === 'user-joao'),
      undefined,
    );
    assert.equal(
      store.bookings.some((item) => item.studentId === 'user-joao'),
      false,
    );
    assert.equal(store.credits.length, 0);
    assert.equal(store.cancellations.length, 0);
    assert.equal(store.waitlist.length, 0);
    assert.equal(store.studentRegularSlots.length, 0);
    assert.equal(
      store.studentTrainers.some((item) => item.studentId === 'user-joao'),
      false,
    );
    assert.equal(
      store.timeSlots.find((item) => item.id === 'slot-past')?.enrolledCount,
      0,
    );
    assert.equal(
      store.timeSlots.find((item) => item.id === 'slot-mon')?.enrolledCount,
      2,
    );
  });

  it('recusa exclusão de aluno pelo TRAINER', async () => {
    const { students } = createStudents();
    await assert.rejects(
      () => students.remove('user-joao', carlos),
      ForbiddenException,
    );
  });

  it('recusa excluir quem não é aluno', async () => {
    const { students } = createStudents();
    await assert.rejects(
      () => students.remove('user-carlos', admin),
      NotFoundException,
    );
  });
});
