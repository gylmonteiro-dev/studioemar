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

export const mockStudent: User = userSchema.parse({
  id: 'user-joao',
  name: 'João',
  email: 'joao@studioemar.local',
  role: 'STUDENT',
  planId: 'plan-3x',
});

export const mockTrainer: User = userSchema.parse({
  id: 'user-carlos',
  name: 'Carlos',
  email: 'carlos@studioemar.local',
  role: 'TRAINER',
});

export const mockPlan: Plan = planSchema.parse({
  id: 'plan-3x',
  name: '3x por semana',
  weeklyFrequency: 3,
});

export const mockRecurringSlots: RecurringSlot[] = [
  recurringSlotSchema.parse({
    id: 'rec-seg-18',
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
    id: 'slot-2026-09-05-17',
    startsAt: '2026-09-05T20:00:00.000Z',
    endsAt: '2026-09-05T21:00:00.000Z',
    capacity: 6,
    enrolledCount: 3,
    status: 'OPEN',
    classType: 'Recovery',
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
    id: 'booking-qua',
    studentId: 'user-joao',
    timeSlotId: 'slot-2026-09-03-18',
    kind: 'REGULAR',
    status: 'CANCELLED',
  }),
  bookingSchema.parse({
    id: 'booking-sex',
    studentId: 'user-joao',
    timeSlotId: 'slot-2026-09-05-17',
    kind: 'MAKEUP',
    status: 'CONFIRMED',
  }),
];

export const mockCancellation: Cancellation = cancellationSchema.parse({
  id: 'cancel-qua',
  bookingId: 'booking-qua',
  cancelledAt: '2026-09-03T08:00:00.000Z',
  generatedCredit: true,
  creditId: 'credit-1',
});

const creditGeneratedAt = new Date('2026-09-03T08:00:00.000Z');

export const mockCredits: Credit[] = [
  creditSchema.parse({
    id: 'credit-1',
    studentId: 'user-joao',
    source: 'CANCELLATION',
    generatedAt: creditGeneratedAt.toISOString(),
    originBookingId: 'booking-qua',
    expiresAt: creditExpiresAt(creditGeneratedAt).toISOString(),
    status: 'AVAILABLE',
  }),
  creditSchema.parse({
    id: 'credit-used',
    studentId: 'user-joao',
    source: 'CANCELLATION',
    generatedAt: '2026-08-15T12:00:00.000Z',
    expiresAt: '2026-09-14T12:00:00.000Z',
    status: 'USED',
    usedAt: '2026-08-15T18:00:00.000Z',
    usedBookingId: 'booking-sex',
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
  startsOn: '2026-09-07',
  endsOn: '2026-09-07',
  reason: 'Studio fechado — feriado informado pelo administrador',
  createdByUserId: 'user-carlos',
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
