import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Booking, Credit, TimeSlot } from '@studioemar/shared';
import {
  availableCredits,
  isEligibleToCredit,
  isRegularTrainingSlot,
  oldestAvailableCredit,
  upcomingConfirmed,
  viewsForStudent,
} from './booking-views';

const joao = 'user-joao';
const now = new Date('2026-09-03T15:00:00.000Z');

const slots: TimeSlot[] = [
  {
    id: 'slot-today-18',
    startsAt: '2026-09-03T18:00:00.000Z',
    endsAt: '2026-09-03T19:00:00.000Z',
    capacity: 6,
    enrolledCount: 4,
    status: 'OPEN',
    name: 'Strength',
    classType: 'Strength',
    trainerId: 'user-carlos',
  },
  {
    id: 'slot-mon-18',
    startsAt: '2026-09-07T21:00:00.000Z',
    endsAt: '2026-09-07T22:00:00.000Z',
    capacity: 6,
    enrolledCount: 6,
    status: 'FULL',
    name: 'Strength',
    classType: 'Strength',
    trainerId: 'user-carlos',
  },
];

const bookings: Booking[] = [
  {
    id: 'booking-hoje',
    studentId: joao,
    timeSlotId: 'slot-today-18',
    kind: 'REGULAR',
    status: 'CONFIRMED',
  },
  {
    id: 'booking-ana',
    studentId: 'user-ana',
    timeSlotId: 'slot-today-18',
    kind: 'REGULAR',
    status: 'CONFIRMED',
  },
  {
    id: 'booking-seg',
    studentId: joao,
    timeSlotId: 'slot-mon-18',
    kind: 'REGULAR',
    status: 'CANCELLED',
  },
];

describe('viewsForStudent', () => {
  it('não mistura a agenda de outro aluno', () => {
    const views = viewsForStudent(bookings, slots, joao);
    assert.deepEqual(
      views.map((item) => item.booking.id),
      ['booking-hoje', 'booking-seg'],
    );
  });

  it('esconde o cancelado quando a mesma aula já foi remarcada', () => {
    const views = viewsForStudent(
      [
        ...bookings,
        {
          id: 'booking-seg-nova',
          studentId: joao,
          timeSlotId: 'slot-mon-18',
          kind: 'REGULAR',
          status: 'CONFIRMED',
        },
      ],
      slots,
      joao,
    );
    assert.deepEqual(
      views.map((item) => item.booking.id),
      ['booking-hoje', 'booking-seg-nova'],
    );
  });
});

describe('upcomingConfirmed', () => {
  it('lista só confirmados futuros do aluno', () => {
    const upcoming = upcomingConfirmed(bookings, slots, joao, now);
    assert.deepEqual(
      upcoming.map((item) => item.booking.id),
      ['booking-hoje'],
    );
  });
});

describe('créditos disponíveis', () => {
  const credits: Credit[] = [
    {
      id: 'c-used',
      studentId: joao,
      source: 'CANCELLATION',
      generatedAt: '2026-08-01T15:00:00.000Z',
      expiresAt: '2026-08-31T15:00:00.000Z',
      status: 'USED',
    },
    {
      id: 'c-late',
      studentId: joao,
      source: 'CANCELLATION',
      generatedAt: '2026-09-02T15:00:00.000Z',
      expiresAt: '2026-10-02T15:00:00.000Z',
      status: 'AVAILABLE',
    },
    {
      id: 'c-soon',
      studentId: joao,
      source: 'TRAINER_CANCELLATION',
      generatedAt: '2026-09-01T15:00:00.000Z',
      expiresAt: '2026-10-01T15:00:00.000Z',
      status: 'AVAILABLE',
    },
  ];

  it('filtra AVAILABLE e escolhe o que vence primeiro (RN-020)', () => {
    assert.deepEqual(
      availableCredits(credits).map((item) => item.id),
      ['c-late', 'c-soon'],
    );
    assert.equal(oldestAvailableCredit(credits)?.id, 'c-soon');
  });
});

describe('isEligibleToCredit', () => {
  it('espelha RN-012 no preview do cancelamento', () => {
    assert.equal(isEligibleToCredit('2026-09-03T18:00:00.000Z', now), false);
    assert.equal(isEligibleToCredit('2026-09-03T21:00:00.000Z', now), true);
    assert.equal(isEligibleToCredit('2026-09-07T21:00:00.000Z', now), true);
  });
});

describe('isRegularTrainingSlot', () => {
  it('bloqueia o dia e o horário da agenda regular', () => {
    assert.equal(
      isRegularTrainingSlot(slots[1], [
        {
          studioHourId: 'hour-1',
          weekday: 'MON',
          name: 'Strength',
          startTime: '18:00',
          endTime: '19:00',
          classType: 'Strength',
          trainerId: 'user-carlos',
        },
      ]),
      true,
    );
    assert.equal(isRegularTrainingSlot(slots[1], []), false);
  });
});
