import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeOccupancy } from './occupancy';

describe('computeOccupancy', () => {
  const now = new Date('2026-09-03T15:00:00.000Z');

  it('agrega métricas de hoje e gráficos pelos horários persistidos', () => {
    const dashboard = computeOccupancy({
      now,
      cancellationCount: 2,
      timeSlots: [
        {
          id: 'slot-today-18',
          startsAt: new Date('2026-09-03T21:00:00.000Z'),
          capacity: 6,
          enrolledCount: 4,
        },
        {
          id: 'slot-mon-18',
          startsAt: new Date('2026-09-07T21:00:00.000Z'),
          capacity: 6,
          enrolledCount: 6,
        },
        {
          id: 'slot-fri-08',
          startsAt: new Date('2026-09-04T11:00:00.000Z'),
          capacity: 6,
          enrolledCount: 3,
        },
      ],
      bookings: [
        {
          studentId: 'user-joao',
          timeSlotId: 'slot-today-18',
          kind: 'REGULAR',
          status: 'CONFIRMED',
        },
        {
          studentId: 'user-ana',
          timeSlotId: 'slot-today-18',
          kind: 'REGULAR',
          status: 'CONFIRMED',
        },
        {
          studentId: 'user-joao',
          timeSlotId: 'slot-mon-18',
          kind: 'MAKEUP',
          status: 'CONFIRMED',
        },
        {
          studentId: 'user-ana',
          timeSlotId: 'slot-today-18',
          kind: 'REGULAR',
          status: 'CANCELLED',
        },
      ],
    });

    assert.equal(dashboard.metrics.studentsToday, 2);
    assert.equal(dashboard.metrics.occupancyPercent, 67);
    assert.equal(dashboard.metrics.freeSpots, 2);
    assert.equal(dashboard.metrics.cancellations, 2);
    assert.equal(dashboard.metrics.makeups, 1);
    assert.deepEqual(dashboard.byHour, [
      { hour: '08:00', occupancyPercent: 50 },
      { hour: '18:00', occupancyPercent: 83 },
    ]);
    assert.equal(
      dashboard.byWeekday.find((item) => item.weekday === 'THU')
        ?.occupancyPercent,
      67,
    );
    assert.equal(
      dashboard.byWeekday.find((item) => item.weekday === 'MON')
        ?.occupancyPercent,
      100,
    );
  });

  it('zera ocupação quando não há horários no dia', () => {
    const dashboard = computeOccupancy({
      now,
      cancellationCount: 0,
      timeSlots: [],
      bookings: [],
    });

    assert.deepEqual(dashboard.metrics, {
      studentsToday: 0,
      occupancyPercent: 0,
      freeSpots: 0,
      cancellations: 0,
      makeups: 0,
    });
    assert.deepEqual(
      dashboard.byWeekday.map((item) => item.weekday),
      ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    );
  });
});
