import { creditExpiresAt } from '../rules/credit-policy.js';
import {
  bookingSchema,
  cancellationSchema,
  creditSchema,
  occupancyDashboardSchema,
  planSchema,
  recurringSlotSchema,
  studioClosureSchema,
  timeSlotSchema,
  userSchema,
  waitlistEntrySchema,
  type Booking,
  type Cancellation,
  type Credit,
  type OccupancyDashboard,
  type Plan,
  type RecurringSlot,
  type StudioClosure,
  type TimeSlot,
  type User,
  type WaitlistEntry,
} from '../schemas/index.js';

/** Relógio determinístico da FASE 2 (quinta 03/09/2026, 12:00 em São Paulo). */
export const MOCK_NOW_ISO = '2026-09-03T15:00:00.000Z';
export const MOCK_NOW = new Date(MOCK_NOW_ISO);

export const mockStudent: User = userSchema.parse({
  id: 'user-joao',
  name: 'João',
  email: 'joao@studioemar.local',
  role: 'STUDENT',
  planId: 'plan-3x',
  mustSetPassword: false,
});

export const mockFirstAccessStudent: User = userSchema.parse({
  id: 'user-ana',
  name: 'Ana',
  email: 'ana@studioemar.local',
  role: 'STUDENT',
  planId: 'plan-3x',
  mustSetPassword: true,
});

export const mockTrainer: User = userSchema.parse({
  id: 'user-carlos',
  name: 'Carlos',
  email: 'carlos@studioemar.local',
  role: 'TRAINER',
});

export const mockUsers: User[] = [
  mockStudent,
  mockFirstAccessStudent,
  mockTrainer,
];

export const mockPlan: Plan = planSchema.parse({
  id: 'plan-3x',
  name: '3x por semana',
  weeklyFrequency: 3,
});

export const mockRecurringSlots: RecurringSlot[] = [
  recurringSlotSchema.parse({
    id: 'rec-mon-18',
    planId: 'plan-3x',
    weekday: 'MON',
    time: '18:00',
  }),
  recurringSlotSchema.parse({
    id: 'rec-wed-18',
    planId: 'plan-3x',
    weekday: 'WED',
    time: '18:00',
  }),
  recurringSlotSchema.parse({
    id: 'rec-fri-17',
    planId: 'plan-3x',
    weekday: 'FRI',
    time: '17:00',
  }),
];

export const mockTimeSlots: TimeSlot[] = [
  timeSlotSchema.parse({
    id: 'slot-2026-09-01-18',
    startsAt: '2026-09-01T21:00:00.000Z',
    endsAt: '2026-09-01T22:00:00.000Z',
    capacity: 6,
    enrolledCount: 4,
    status: 'OPEN',
    classType: 'Funcional',
    trainerId: 'user-carlos',
  }),
  timeSlotSchema.parse({
    id: 'slot-2026-09-02-18',
    startsAt: '2026-09-02T21:00:00.000Z',
    endsAt: '2026-09-02T22:00:00.000Z',
    capacity: 6,
    enrolledCount: 5,
    status: 'OPEN',
    classType: 'Treino de Força Avançado',
    trainerId: 'user-carlos',
  }),
  timeSlotSchema.parse({
    id: 'slot-2026-09-03-18',
    startsAt: '2026-09-03T21:00:00.000Z',
    endsAt: '2026-09-03T22:00:00.000Z',
    capacity: 6,
    enrolledCount: 5,
    status: 'OPEN',
    classType: 'Treino de Força Avançado',
    trainerId: 'user-carlos',
  }),
  timeSlotSchema.parse({
    id: 'slot-2026-09-04-17',
    startsAt: '2026-09-04T20:00:00.000Z',
    endsAt: '2026-09-04T21:00:00.000Z',
    capacity: 6,
    enrolledCount: 3,
    status: 'OPEN',
    classType: 'Recovery',
    trainerId: 'user-carlos',
  }),
  timeSlotSchema.parse({
    id: 'slot-2026-09-07-18',
    startsAt: '2026-09-07T21:00:00.000Z',
    endsAt: '2026-09-07T22:00:00.000Z',
    capacity: 6,
    enrolledCount: 4,
    status: 'OPEN',
    classType: 'Funcional',
    trainerId: 'user-carlos',
  }),
  timeSlotSchema.parse({
    id: 'slot-2026-09-09-18',
    startsAt: '2026-09-09T21:00:00.000Z',
    endsAt: '2026-09-09T22:00:00.000Z',
    capacity: 6,
    enrolledCount: 4,
    status: 'OPEN',
    classType: 'LPO',
    trainerId: 'user-carlos',
  }),
  timeSlotSchema.parse({
    id: 'slot-2026-09-13-07',
    startsAt: '2026-09-13T10:00:00.000Z',
    endsAt: '2026-09-13T11:00:00.000Z',
    capacity: 6,
    enrolledCount: 4,
    status: 'OPEN',
    classType: 'Funcional',
    trainerId: 'user-carlos',
  }),
  timeSlotSchema.parse({
    id: 'slot-2026-09-13-08',
    startsAt: '2026-09-13T11:00:00.000Z',
    endsAt: '2026-09-13T12:00:00.000Z',
    capacity: 6,
    enrolledCount: 6,
    status: 'FULL',
    classType: 'Funcional',
    trainerId: 'user-carlos',
  }),
  timeSlotSchema.parse({
    id: 'slot-2026-09-13-17',
    startsAt: '2026-09-13T20:00:00.000Z',
    endsAt: '2026-09-13T21:00:00.000Z',
    capacity: 6,
    enrolledCount: 5,
    status: 'OPEN',
    classType: 'Cross Training',
    trainerId: 'user-carlos',
  }),
  timeSlotSchema.parse({
    id: 'slot-2026-09-14-18',
    startsAt: '2026-09-14T21:00:00.000Z',
    endsAt: '2026-09-14T22:00:00.000Z',
    capacity: 6,
    enrolledCount: 3,
    status: 'OPEN',
    classType: 'Funcional',
    trainerId: 'user-carlos',
  }),
];

export const mockBookings: Booking[] = [
  bookingSchema.parse({
    id: 'booking-seg',
    studentId: 'user-joao',
    timeSlotId: 'slot-2026-09-01-18',
    kind: 'REGULAR',
    status: 'CONFIRMED',
  }),
  bookingSchema.parse({
    id: 'booking-qua-cancelada',
    studentId: 'user-joao',
    timeSlotId: 'slot-2026-09-02-18',
    kind: 'REGULAR',
    status: 'CANCELLED',
  }),
  bookingSchema.parse({
    id: 'booking-hoje-sem-credito',
    studentId: 'user-joao',
    timeSlotId: 'slot-2026-09-03-18',
    kind: 'REGULAR',
    status: 'CONFIRMED',
  }),
  bookingSchema.parse({
    id: 'booking-sex',
    studentId: 'user-joao',
    timeSlotId: 'slot-2026-09-04-17',
    kind: 'REGULAR',
    status: 'CONFIRMED',
  }),
  bookingSchema.parse({
    id: 'booking-seg-com-credito',
    studentId: 'user-joao',
    timeSlotId: 'slot-2026-09-07-18',
    kind: 'REGULAR',
    status: 'CONFIRMED',
  }),
  bookingSchema.parse({
    id: 'booking-qua-reposicao',
    studentId: 'user-joao',
    timeSlotId: 'slot-2026-09-09-18',
    kind: 'MAKEUP',
    status: 'CONFIRMED',
  }),
];

export const mockCancellations: Cancellation[] = [
  cancellationSchema.parse({
    id: 'cancel-qua',
    bookingId: 'booking-qua-cancelada',
    cancelledAt: '2026-09-01T12:00:00.000Z',
    cancelledBy: 'STUDENT',
    generatedCredit: true,
    creditId: 'credit-1',
  }),
];

const creditFromCancellationAt = new Date('2026-09-01T12:00:00.000Z');
const creditFromTrainerAt = new Date('2026-08-20T12:00:00.000Z');
const creditUsedAt = new Date('2026-08-15T12:00:00.000Z');
const creditAnnulledAt = new Date('2026-08-10T12:00:00.000Z');

export const mockCredits: Credit[] = [
  creditSchema.parse({
    id: 'credit-1',
    studentId: 'user-joao',
    source: 'CANCELLATION',
    generatedAt: creditFromCancellationAt.toISOString(),
    originBookingId: 'booking-qua-cancelada',
    expiresAt: creditExpiresAt(creditFromCancellationAt).toISOString(),
    status: 'AVAILABLE',
  }),
  creditSchema.parse({
    id: 'credit-trainer',
    studentId: 'user-joao',
    source: 'TRAINER_CANCELLATION',
    generatedAt: creditFromTrainerAt.toISOString(),
    originBookingId: 'booking-qua-cancelada',
    expiresAt: creditExpiresAt(creditFromTrainerAt).toISOString(),
    status: 'AVAILABLE',
  }),
  creditSchema.parse({
    id: 'credit-used',
    studentId: 'user-joao',
    source: 'CANCELLATION',
    generatedAt: creditUsedAt.toISOString(),
    expiresAt: creditExpiresAt(creditUsedAt).toISOString(),
    status: 'USED',
    usedAt: '2026-08-15T18:00:00.000Z',
    usedBookingId: 'booking-qua-reposicao',
  }),
  creditSchema.parse({
    id: 'credit-annulled',
    studentId: 'user-joao',
    source: 'CANCELLATION',
    generatedAt: creditAnnulledAt.toISOString(),
    expiresAt: creditExpiresAt(creditAnnulledAt).toISOString(),
    status: 'ANNULLED',
    annulledAt: '2026-08-12T10:00:00.000Z',
    annulledByUserId: 'user-carlos',
  }),
];

export const mockWaitlistEntry: WaitlistEntry = waitlistEntrySchema.parse({
  id: 'wait-1',
  timeSlotId: 'slot-2026-09-13-08',
  studentId: 'user-joao',
  position: 1,
  enqueuedAt: '2026-09-12T14:00:00.000Z',
  status: 'WAITING',
});

export const mockStudioClosure: StudioClosure = studioClosureSchema.parse({
  id: 'closure-independencia',
  startsOn: '2026-09-08',
  endsOn: '2026-09-08',
  reason: 'Studio fechado — recesso informado pelo administrador',
  createdByUserId: 'user-carlos',
  grantsCredit: false,
});

export const mockOccupancyDashboard: OccupancyDashboard =
  occupancyDashboardSchema.parse({
    metrics: {
      studentsToday: 47,
      occupancyPercent: 82,
      freeSpots: 11,
      cancellations: 4,
      makeups: 6,
    },
    byHour: [
      { hour: '07:00', occupancyPercent: 45 },
      { hour: '08:00', occupancyPercent: 62 },
      { hour: '17:00', occupancyPercent: 91 },
      { hour: '18:00', occupancyPercent: 100 },
      { hour: '19:00', occupancyPercent: 96 },
    ],
    byWeekday: [
      { weekday: 'MON', occupancyPercent: 82 },
      { weekday: 'TUE', occupancyPercent: 71 },
      { weekday: 'WED', occupancyPercent: 94 },
      { weekday: 'THU', occupancyPercent: 76 },
      { weekday: 'FRI', occupancyPercent: 89 },
    ],
  });
