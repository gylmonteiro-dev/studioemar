import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import type { Clock } from '../common/clock';
import { createMemoryPrisma, fixedClock } from '../test/memory-prisma';

const NOW = '2026-09-03T15:00:00.000Z';

const plan = { id: 'plan-3x', name: '3x', weeklyFrequency: 3 };
const slotToday = {
  id: 'slot-today-18',
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
});
