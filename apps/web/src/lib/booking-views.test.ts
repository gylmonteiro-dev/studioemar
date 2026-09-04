import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Booking, Credit, TimeSlot } from '@studioemar/shared';
import {
  availableCredits,
  isEligibleToCredit,
  oldestAvailableCredit,
  upcomingConfirmed,
  viewsForStudent,
} from './booking-views';

const joao = 'user-joao';
const now = new Date('2026-09-03T15:00:00.000Z');

const slots: TimeSlot[] = [
  {
    id: 'slot-today-18',
    startsAt: '2026-09-03T21:00:00.000Z',
    endsAt: '2026-09-03T22:00:00.000Z',
    capacity: 6,
    enrolledCount: 4,
    status: 'OPEN',
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
    assert.equal(isEligibleToCredit('2026-09-03T21:00:00.000Z', now), false);
    assert.equal(isEligibleToCredit('2026-09-07T21:00:00.000Z', now), true);
  });
});
