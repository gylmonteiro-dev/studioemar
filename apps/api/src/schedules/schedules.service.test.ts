import { creditExpiresAt } from '@studioemar/shared';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import type { Clock } from '../common/clock';
import { createMemoryPrisma, fixedClock } from '../test/memory-prisma';

const NOW = '2026-09-03T15:00:00.000Z';

const carlos = {
  id: 'user-carlos',
  name: 'Carlos',
  email: 'carlos@studioemar.local',
  role: 'TRAINER' as const,
  planId: null,
  mustSetPassword: false,
  passwordHash: 'hash',
};

const plan = { id: 'plan-3x', name: '3x semana', weeklyFrequency: 3 };

const classTypes = [
  { id: 'type-funcional', name: 'FUNCIONAL' },
  { id: 'type-strength', name: 'STRENGTH' },
  { id: 'type-recovery', name: 'RECOVERY' },
];
const slotToday = {
  id: 'slot-today-18',
  name: 'Strength',
  startsAt: new Date('2026-09-03T21:00:00.000Z'),
  endsAt: new Date('2026-09-03T22:00:00.000Z'),
  capacity: 6,
  enrolledCount: 2,
  status: 'OPEN' as const,
  classType: 'Strength',
  trainerId: 'user-carlos',
};

describe('SchedulesService', () => {
  it('recusa horário recorrente duplicado', async () => {
    const { prisma } = createMemoryPrisma({
      plans: [plan],
      recurringSlots: [
        { id: 'rec-1', planId: 'plan-3x', weekday: 'MON', time: '18:00' },
      ],
    });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    await assert.rejects(
      () =>
        schedules.addRecurringSlot({
          planId: 'plan-3x',
          weekday: 'MON',
          time: '18:00',
        }),
      ConflictException,
    );
  });

  it('recusa plano inexistente no horário recorrente', async () => {
    const { prisma } = createMemoryPrisma({ plans: [] });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    await assert.rejects(
      () =>
        schedules.addRecurringSlot({
          planId: 'missing',
          weekday: 'MON',
          time: '18:00',
        }),
      NotFoundException,
    );
  });

  it('fechamento sem crédito cancela aulas e fecha o horário (RN-014 / RN-019)', async () => {
    const { prisma, store } = createMemoryPrisma({
      timeSlots: [slotToday],
      bookings: [
        {
          id: 'booking-1',
          studentId: 'user-joao',
          timeSlotId: 'slot-today-18',
          kind: 'REGULAR',
          status: 'CONFIRMED',
        },
      ],
    });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    const closure = await schedules.createClosure(
      {
        startsOn: '2026-09-03',
        endsOn: '2026-09-03',
        reason: 'Recesso',
        grantsCredit: false,
      },
      'user-carlos',
    );
    assert.equal(closure.grantsCredit, false);
    assert.equal(store.credits.length, 0);
    assert.equal(store.bookings[0]?.status, 'CANCELLED');
    assert.equal(store.cancellations[0]?.generatedCredit, false);
    assert.equal(store.timeSlots[0]?.status, 'CLOSED');
    assert.equal(store.timeSlots[0]?.enrolledCount, 1);
  });

  it('fechamento com grantsCredit gera CLOSURE_COMPENSATION', async () => {
    const { prisma, store } = createMemoryPrisma({
      timeSlots: [slotToday],
      bookings: [
        {
          id: 'booking-1',
          studentId: 'user-joao',
          timeSlotId: 'slot-today-18',
          kind: 'REGULAR',
          status: 'CONFIRMED',
        },
      ],
    });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    await schedules.createClosure(
      {
        startsOn: '2026-09-03',
        endsOn: '2026-09-03',
        reason: 'Férias',
        grantsCredit: true,
      },
      'user-carlos',
    );
    assert.equal(store.credits[0]?.source, 'CLOSURE_COMPENSATION');
    assert.equal(store.credits[0]?.originClosureId, store.closures[0]?.id);
    assert.equal(
      store.credits[0]?.expiresAt.toISOString(),
      creditExpiresAt(slotToday.startsAt).toISOString(),
    );
    assert.equal(store.cancellations[0]?.generatedCredit, true);
  });

  it('lista espera em ordem FIFO', async () => {
    const { prisma } = createMemoryPrisma({
      timeSlots: [slotToday],
      waitlist: [
        {
          id: 'w-2',
          timeSlotId: 'slot-today-18',
          studentId: 'user-ana',
          position: 2,
          enqueuedAt: new Date(NOW),
          status: 'WAITING',
        },
        {
          id: 'w-1',
          timeSlotId: 'slot-today-18',
          studentId: 'user-joao',
          position: 1,
          enqueuedAt: new Date(NOW),
          status: 'WAITING',
        },
      ],
    });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    const queue = await schedules.listWaitlist('slot-today-18');
    assert.deepEqual(
      queue.map((entry) => entry.studentId),
      ['user-joao', 'user-ana'],
    );
  });

  it('cria turma seg/qua/sex e materializa a folga de 12 semanas', async () => {
    const { prisma, store } = createMemoryPrisma({
      users: [carlos],
      classTypes,
    });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    const hour = await schedules.createStudioHour({
      name: 'Manhã funcional',
      weekdays: ['FRI', 'MON', 'WED'],
      startTime: '07:30',
      endTime: '08:30',
      capacity: 6,
      classType: 'Funcional',
      trainerId: 'user-carlos',
    });
    assert.deepEqual(hour.weekdays, ['MON', 'WED', 'FRI']);
    assert.equal(hour.name, 'Manhã funcional');
    assert.equal(store.timeSlots.length, 36);
    assert.equal(store.timeSlots[0]?.name, 'Manhã funcional');
    assert.equal(
      store.timeSlots[0]?.startsAt.toISOString(),
      '2026-09-04T10:30:00.000Z',
    );
    assert.equal(store.timeSlots[0]?.studioHourId, hour.id);
  });

  it('permite turmas paralelas no mesmo intervalo', async () => {
    const { prisma, store } = createMemoryPrisma({
      users: [carlos],
      classTypes,
      timeSlots: [
        {
          id: 'slot-fri',
          name: 'Strength',
          startsAt: new Date('2026-09-04T10:30:00.000Z'),
          endsAt: new Date('2026-09-04T11:30:00.000Z'),
          capacity: 6,
          enrolledCount: 0,
          status: 'OPEN',
          classType: 'Strength',
          trainerId: 'user-carlos',
        },
      ],
    });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    const hour = await schedules.createStudioHour({
      name: 'Funcional paralelo',
      weekdays: ['FRI'],
      startTime: '07:30',
      endTime: '08:30',
      capacity: 6,
      classType: 'Funcional',
      trainerId: 'user-carlos',
    });
    assert.equal(hour.startTime, '07:30');
    assert.ok(store.timeSlots.length > 1);
  });

  it('recusa excluir horário com alunos inscritos', async () => {
    const { prisma, store } = createMemoryPrisma({
      users: [carlos],
      classTypes,
    });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    await schedules.createStudioHour({
      name: 'Funcional sexta',
      weekdays: ['FRI'],
      startTime: '07:30',
      endTime: '08:30',
      capacity: 6,
      classType: 'Funcional',
      trainerId: 'user-carlos',
    });
    const first = store.timeSlots[0];
    if (!first) {
      throw new Error('slot ausente');
    }
    first.enrolledCount = 2;
    await assert.rejects(
      () => schedules.deleteTimeSlot(first.id),
      ConflictException,
    );
  });

  it('inclui horário pontual futuro', async () => {
    const { prisma, store } = createMemoryPrisma({
      users: [carlos],
      classTypes,
    });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    const slot = await schedules.createTimeSlot({
      name: 'Recovery extra',
      date: '2026-09-10',
      startTime: '19:00',
      endTime: '20:00',
      capacity: 8,
      classType: 'Recovery',
      trainerId: 'user-carlos',
    });
    assert.equal(slot.capacity, 8);
    assert.equal(store.timeSlots.length, 1);
    assert.equal(slot.startsAt, '2026-09-10T22:00:00.000Z');
  });

  it('materializa uma semana além da folga sem duplicar', async () => {
    const { prisma, store } = createMemoryPrisma({
      users: [carlos],
      classTypes,
    });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    await schedules.createStudioHour({
      name: 'Manhã funcional',
      weekdays: ['MON', 'WED', 'FRI'],
      startTime: '07:30',
      endTime: '08:30',
      capacity: 6,
      classType: 'Funcional',
      trainerId: 'user-carlos',
    });
    const firstCount = store.timeSlots.length;
    await schedules.listTimeSlots(undefined, {
      from: '2027-03-01',
      to: '2027-03-07',
    });
    assert.ok(store.timeSlots.length > firstCount);
    const after = store.timeSlots.length;
    const week = await schedules.listTimeSlots(undefined, {
      from: '2027-03-01',
      to: '2027-03-07',
    });
    assert.equal(store.timeSlots.length, after);
    assert.ok(week.some((slot) => slot.name === 'Manhã funcional'));
    assert.ok(week.every((slot) => slot.startsAt.startsWith('2027-03')));
  });

  it('omite data de fechamento na geração', async () => {
    const { prisma, store } = createMemoryPrisma({
      users: [carlos],
      classTypes,
      closures: [
        {
          id: 'closure-1',
          startsOn: new Date('2026-09-04T00:00:00.000Z'),
          endsOn: new Date('2026-09-04T00:00:00.000Z'),
          reason: 'Recesso',
          createdByUserId: 'user-carlos',
          grantsCredit: false,
        },
      ],
    });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    await schedules.createStudioHour({
      name: 'Manhã funcional',
      weekdays: ['FRI'],
      startTime: '07:30',
      endTime: '08:30',
      capacity: 6,
      classType: 'Funcional',
      trainerId: 'user-carlos',
    });
    assert.equal(
      store.timeSlots.some(
        (slot) => slot.startsAt.toISOString() === '2026-09-04T10:30:00.000Z',
      ),
      false,
    );
  });

  it('inscreve aluno regular ativo na aula gerada depois', async () => {
    const { prisma, store } = createMemoryPrisma({
      users: [
        carlos,
        {
          id: 'user-ana',
          name: 'Ana',
          email: 'ana@studioemar.local',
          role: 'STUDENT',
          planId: 'plan-3x',
          mustSetPassword: true,
          passwordHash: null,
          isActive: true,
        },
      ],
      classTypes,
    });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    const hour = await schedules.createStudioHour({
      name: 'Manhã funcional',
      weekdays: ['MON'],
      startTime: '07:30',
      endTime: '08:30',
      capacity: 6,
      classType: 'Funcional',
      trainerId: 'user-carlos',
    });
    store.studentRegularSlots.push({
      id: 'regular-1',
      studentId: 'user-ana',
      studioHourId: hour.id,
      weekday: 'MON',
    });
    await schedules.listTimeSlots();
    assert.ok(store.bookings.some((booking) => booking.studentId === 'user-ana'));
    assert.ok(store.bookings.every((booking) => booking.kind === 'REGULAR'));
  });

  it('não inscreve aluno inativo nas aulas novas', async () => {
    const { prisma, store } = createMemoryPrisma({
      users: [
        carlos,
        {
          id: 'user-ana',
          name: 'Ana',
          email: 'ana@studioemar.local',
          role: 'STUDENT',
          planId: 'plan-3x',
          mustSetPassword: true,
          passwordHash: null,
          isActive: false,
        },
      ],
      classTypes,
    });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    const hour = await schedules.createStudioHour({
      name: 'Manhã funcional',
      weekdays: ['MON'],
      startTime: '07:30',
      endTime: '08:30',
      capacity: 6,
      classType: 'Funcional',
      trainerId: 'user-carlos',
    });
    store.studentRegularSlots.push({
      id: 'regular-1',
      studentId: 'user-ana',
      studioHourId: hour.id,
      weekday: 'MON',
    });
    await schedules.listTimeSlots();
    assert.equal(store.bookings.length, 0);
  });

  it('exclui turma com inscritos e cancela as reservas futuras', async () => {
    const { prisma, store } = createMemoryPrisma({
      users: [carlos],
      classTypes,
    });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    const hour = await schedules.createStudioHour({
      name: 'Manhã funcional',
      weekdays: ['FRI'],
      startTime: '07:30',
      endTime: '08:30',
      capacity: 6,
      classType: 'Funcional',
      trainerId: 'user-carlos',
    });
    const first = store.timeSlots[0];
    if (!first) {
      throw new Error('slot ausente');
    }
    store.bookings.push({
      id: 'booking-1',
      studentId: 'user-joao',
      timeSlotId: first.id,
      kind: 'REGULAR',
      status: 'CONFIRMED',
    });
    first.enrolledCount = 1;
    await schedules.deleteStudioHour(hour.id);
    assert.equal(store.studioHours.length, 0);
    assert.equal(store.bookings[0]?.status, 'CANCELLED');
    assert.equal(store.cancellations.length, 1);
    assert.equal(
      store.timeSlots.some((slot) => slot.studioHourId === hour.id),
      false,
    );
  });

  it('grava tipo de aula em maiúsculas e recusa nome duplicado', async () => {
    const { prisma, store } = createMemoryPrisma();
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    const created = await schedules.createClassType({ name: ' funcional ' });
    assert.equal(created.name, 'FUNCIONAL');
    assert.equal(store.classTypes.length, 1);
    await assert.rejects(
      () => schedules.createClassType({ name: 'FUNCIONAL' }),
      ConflictException,
    );
  });

  it('recusa horário com tipo de aula não cadastrado', async () => {
    const { prisma } = createMemoryPrisma({ users: [carlos] });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    await assert.rejects(
      () =>
        schedules.createStudioHour({
          name: 'Manhã',
          weekdays: ['MON'],
          startTime: '07:30',
          endTime: '08:30',
          capacity: 6,
          classType: 'Inexistente',
          trainerId: 'user-carlos',
        }),
      BadRequestException,
    );
  });

  it('lista sem intervalo só a folga vigente, não o histórico', async () => {
    const { prisma } = createMemoryPrisma({
      users: [carlos],
      classTypes,
      timeSlots: [
        {
          ...slotToday,
          id: 'slot-past',
          startsAt: new Date('2025-09-03T21:00:00.000Z'),
          endsAt: new Date('2025-09-03T22:00:00.000Z'),
        },
        {
          ...slotToday,
          id: 'slot-far',
          startsAt: new Date('2028-03-01T21:00:00.000Z'),
          endsAt: new Date('2028-03-01T22:00:00.000Z'),
        },
        slotToday,
      ],
    });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    const listed = await schedules.listTimeSlots();
    assert.ok(listed.some((slot) => slot.id === 'slot-today-18'));
    assert.equal(
      listed.some((slot) => slot.id === 'slot-past' || slot.id === 'slot-far'),
      false,
    );
  });

  it('não reinscreve regulares em aula já lotada', async () => {
    const { prisma, store } = createMemoryPrisma({
      users: [
        carlos,
        {
          id: 'user-ana',
          name: 'Ana',
          email: 'ana@studioemar.local',
          role: 'STUDENT',
          planId: 'plan-3x',
          mustSetPassword: true,
          passwordHash: null,
          isActive: true,
        },
      ],
      classTypes,
    });
    const schedules = new SchedulesService(prisma, fixedClock(NOW) as Clock);
    const hour = await schedules.createStudioHour({
      name: 'Manhã funcional',
      weekdays: ['MON'],
      startTime: '07:30',
      endTime: '08:30',
      capacity: 1,
      classType: 'Funcional',
      trainerId: 'user-carlos',
    });
    for (const slot of store.timeSlots) {
      slot.enrolledCount = 1;
      slot.status = 'FULL';
    }
    store.studentRegularSlots.push({
      id: 'regular-1',
      studentId: 'user-ana',
      studioHourId: hour.id,
      weekday: 'MON',
    });
    const before = store.bookings.length;
    await schedules.listTimeSlots();
    assert.equal(store.bookings.length, before);
  });
});
