import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Clock } from '../common/clock';
import { createMemoryPrisma, fixedClock } from '../test/memory-prisma';
import { DashboardService } from './dashboard.service';

const NOW = '2026-09-03T15:00:00.000Z';

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

describe('DashboardService', () => {
  it('ignora aulas fora da folga vigente', async () => {
    const { prisma } = createMemoryPrisma({
      timeSlots: [
        {
          ...slotToday,
          id: 'slot-past',
          startsAt: new Date('2025-09-03T21:00:00.000Z'),
          endsAt: new Date('2025-09-03T22:00:00.000Z'),
          enrolledCount: 6,
          status: 'FULL',
        },
        slotToday,
      ],
      bookings: [
        {
          id: 'booking-old',
          studentId: 'user-ana',
          timeSlotId: 'slot-past',
          kind: 'REGULAR',
          status: 'CONFIRMED',
        },
        {
          id: 'booking-today',
          studentId: 'user-joao',
          timeSlotId: 'slot-today-18',
          kind: 'REGULAR',
          status: 'CONFIRMED',
        },
      ],
      cancellations: [
        {
          id: 'cancel-old',
          bookingId: 'booking-old',
          cancelledAt: new Date('2025-09-03T12:00:00.000Z'),
          cancelledBy: 'STUDENT',
          generatedCredit: false,
          creditId: null,
        },
      ],
    });
    const dashboard = new DashboardService(prisma, fixedClock(NOW) as Clock);
    const result = await dashboard.occupancy();
    assert.equal(result.metrics.occupancyPercent, 33);
    assert.equal(result.metrics.cancellations, 0);
    assert.equal(result.metrics.studentsToday, 1);
    assert.equal(
      result.byHour.find((item) => item.hour === '18:00')?.occupancyPercent,
      33,
    );
  });

  it('ignora aula fechada de turma já excluída', async () => {
    const { prisma } = createMemoryPrisma({
      timeSlots: [
        slotToday,
        {
          ...slotToday,
          id: 'slot-orphan',
          studioHourId: null,
          status: 'CLOSED',
          enrolledCount: 0,
        },
      ],
    });
    const dashboard = new DashboardService(prisma, fixedClock(NOW) as Clock);
    const result = await dashboard.occupancy();
    assert.equal(result.metrics.occupancyPercent, 33);
    assert.equal(
      result.byHour.find((item) => item.hour === '18:00')?.occupancyPercent,
      33,
    );
  });
});
