'use client';

import {
  bookingSchema,
  cancellationSchema,
  creditExpiresAt,
  creditSchema,
  isCancellationEligibleForCredit,
  recurringSlotSchema,
  studioClosureSchema,
  userSchema,
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
  type Weekday,
} from '@studioemar/shared';
import {
  MOCK_NOW,
  mockBookings,
  mockCancellations,
  mockCredits,
  mockPlan,
  mockRecurringSlots,
  mockStudioClosure,
  mockTimeSlots,
  mockTrainer,
  mockUsers,
  mockWaitlistEntry,
} from '@studioemar/shared/mocks';
import { useSyncExternalStore } from 'react';
import { calendarDate, clockTime, weekdayIndex } from './format';

type StudioState = {
  users: User[];
  bookings: Booking[];
  credits: Credit[];
  cancellations: Cancellation[];
  timeSlots: TimeSlot[];
  plans: Plan[];
  recurringSlots: RecurringSlot[];
  closures: StudioClosure[];
  waitlist: WaitlistEntry[];
};

const WEEKDAY_BY_INDEX: Weekday[] = [
  'SUN',
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
];

const listeners = new Set<() => void>();
let version = 0;

let state: StudioState = {
  users: mockUsers.map((user) => ({ ...user })),
  bookings: mockBookings.map((item) => ({ ...item })),
  credits: mockCredits.map((item) => ({ ...item })),
  cancellations: mockCancellations.map((item) => ({ ...item })),
  timeSlots: mockTimeSlots.map((item) => ({ ...item })),
  plans: [{ ...mockPlan }],
  recurringSlots: mockRecurringSlots.map((item) => ({ ...item })),
  closures: [{ ...mockStudioClosure }],
  waitlist: [{ ...mockWaitlistEntry }],
};

function emit(): void {
  version += 1;
  listeners.forEach((listener) => {
    listener();
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getVersion(): number {
  return version;
}

export function useStudioMock(): StudioState {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return state;
}

export function getMockNow(): Date {
  return MOCK_NOW;
}

export function findStudentByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase();
  return state.users.find(
    (user) => user.role === 'STUDENT' && user.email.toLowerCase() === normalized,
  );
}

export function findUserByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase();
  return state.users.find((user) => user.email.toLowerCase() === normalized);
}

export function findUserById(userId: string): User | undefined {
  return state.users.find((user) => user.id === userId);
}

export function students(): User[] {
  return state.users.filter((user) => user.role === 'STUDENT');
}

export function completeFirstAccess(userId: string): void {
  state = {
    ...state,
    users: state.users.map((user) =>
      user.id === userId ? { ...user, mustSetPassword: false } : user,
    ),
  };
  emit();
}

export function getTrainerName(): string {
  return mockTrainer.name;
}

export type BookingView = {
  booking: Booking;
  slot: TimeSlot;
};

export function viewsForStudent(studentId: string): BookingView[] {
  return state.bookings
    .filter((booking) => booking.studentId === studentId)
    .map((booking) => {
      const slot = state.timeSlots.find((item) => item.id === booking.timeSlotId);
      if (!slot) {
        return null;
      }
      return { booking, slot };
    })
    .filter((item): item is BookingView => item !== null)
    .sort(
      (left, right) =>
        new Date(left.slot.startsAt).getTime() - new Date(right.slot.startsAt).getTime(),
    );
}

export function upcomingConfirmed(studentId: string): BookingView[] {
  const now = MOCK_NOW.getTime();
  return viewsForStudent(studentId).filter(
    (item) =>
      item.booking.status === 'CONFIRMED' &&
      new Date(item.slot.startsAt).getTime() >= now,
  );
}

export function availableCredits(studentId: string): Credit[] {
  return state.credits.filter(
    (credit) => credit.studentId === studentId && credit.status === 'AVAILABLE',
  );
}

export function isEligibleToCredit(startsAt: string): boolean {
  return isCancellationEligibleForCredit(MOCK_NOW, new Date(startsAt));
}

export function cancelBooking(bookingId: string): {
  generatedCredit: boolean;
} {
  const booking = state.bookings.find((item) => item.id === bookingId);
  if (!booking || booking.status !== 'CONFIRMED') {
    throw new Error('Reserva não pode ser cancelada');
  }

  const slot = state.timeSlots.find((item) => item.id === booking.timeSlotId);
  if (!slot) {
    throw new Error('Horário não encontrado');
  }

  const generatedCredit = isEligibleToCredit(slot.startsAt);
  const creditId = generatedCredit ? `credit-${Date.now()}` : undefined;

  let credits = state.credits;
  if (generatedCredit && creditId) {
    const generatedAt = MOCK_NOW;
    credits = [
      ...credits,
      creditSchema.parse({
        id: creditId,
        studentId: booking.studentId,
        source: 'CANCELLATION',
        generatedAt: generatedAt.toISOString(),
        originBookingId: booking.id,
        expiresAt: creditExpiresAt(generatedAt).toISOString(),
        status: 'AVAILABLE',
      }),
    ];
  }

  const enrolledCount = Math.max(0, slot.enrolledCount - 1);

  state = {
    ...state,
    bookings: state.bookings.map((item) =>
      item.id === bookingId ? { ...item, status: 'CANCELLED' } : item,
    ),
    timeSlots: state.timeSlots.map((item) =>
      item.id === slot.id
        ? {
            ...item,
            enrolledCount,
            status: enrolledCount >= item.capacity ? 'FULL' : 'OPEN',
          }
        : item,
    ),
    credits,
    cancellations: [
      ...state.cancellations,
      cancellationSchema.parse({
        id: `cancel-${Date.now()}`,
        bookingId: booking.id,
        cancelledAt: MOCK_NOW.toISOString(),
        cancelledBy: 'STUDENT',
        generatedCredit,
        creditId,
      }),
    ],
  };
  emit();
  return { generatedCredit };
}

export function redeemCredit(studentId: string, timeSlotId: string): Booking {
  const slot = state.timeSlots.find((item) => item.id === timeSlotId);
  if (!slot) {
    throw new Error('Horário não encontrado');
  }
  if (slot.status === 'FULL' || slot.enrolledCount >= slot.capacity) {
    throw new Error('Horário lotado');
  }

  const alreadyBooked = state.bookings.some(
    (booking) =>
      booking.studentId === studentId &&
      booking.timeSlotId === timeSlotId &&
      booking.status === 'CONFIRMED',
  );
  if (alreadyBooked) {
    throw new Error('Você já está neste horário');
  }

  const credit = availableCredits(studentId)
    .slice()
    .sort(
      (left, right) =>
        new Date(left.expiresAt).getTime() - new Date(right.expiresAt).getTime(),
    )[0];
  if (!credit) {
    throw new Error('Sem crédito disponível');
  }

  const booking = bookingSchema.parse({
    id: `booking-makeup-${Date.now()}`,
    studentId,
    timeSlotId,
    kind: 'MAKEUP',
    status: 'CONFIRMED',
  });

  const enrolledCount = slot.enrolledCount + 1;

  state = {
    ...state,
    bookings: [...state.bookings, booking],
    credits: state.credits.map((item) =>
      item.id === credit.id
        ? {
            ...item,
            status: 'USED',
            usedAt: MOCK_NOW.toISOString(),
            usedBookingId: booking.id,
          }
        : item,
    ),
    timeSlots: state.timeSlots.map((item) =>
      item.id === slot.id
        ? {
            ...item,
            enrolledCount,
            status: enrolledCount >= item.capacity ? 'FULL' : 'OPEN',
          }
        : item,
    ),
  };
  emit();
  return booking;
}

function slotOnDate(slot: TimeSlot, date: string): boolean {
  return calendarDate(slot.startsAt) === date;
}

function dateInRange(date: string, startsOn: string, endsOn: string): boolean {
  return date >= startsOn && date <= endsOn;
}

function grantCredit(input: {
  studentId: string;
  source: Credit['source'];
  originBookingId?: string;
  originClosureId?: string;
}): Credit {
  const generatedAt = MOCK_NOW;
  return creditSchema.parse({
    id: `credit-${Date.now()}-${input.studentId}`,
    studentId: input.studentId,
    source: input.source,
    generatedAt: generatedAt.toISOString(),
    originBookingId: input.originBookingId,
    originClosureId: input.originClosureId,
    expiresAt: creditExpiresAt(generatedAt).toISOString(),
    status: 'AVAILABLE',
  });
}

function releaseSlotSeat(slot: TimeSlot): TimeSlot {
  const enrolledCount = Math.max(0, slot.enrolledCount - 1);
  return {
    ...slot,
    enrolledCount,
    status:
      slot.status === 'CLOSED'
        ? 'CLOSED'
        : enrolledCount >= slot.capacity
          ? 'FULL'
          : 'OPEN',
  };
}

export function createStudent(input: {
  name: string;
  email: string;
  planId: string;
}): User {
  const email = input.email.trim().toLowerCase();
  if (state.users.some((user) => user.email.toLowerCase() === email)) {
    throw new Error('Já existe uma conta com este e-mail');
  }
  if (!state.plans.some((plan) => plan.id === input.planId)) {
    throw new Error('Plano não encontrado');
  }

  const student = userSchema.parse({
    id: `user-${Date.now()}`,
    name: input.name.trim(),
    email,
    role: 'STUDENT',
    planId: input.planId,
    mustSetPassword: true,
  });

  state = {
    ...state,
    users: [...state.users, student],
  };
  emit();
  return student;
}

export function annulCredit(creditId: string, trainerId: string): Credit {
  const credit = state.credits.find((item) => item.id === creditId);
  if (!credit || credit.status !== 'AVAILABLE') {
    throw new Error('Crédito não pode ser anulado');
  }

  const updated = {
    ...credit,
    status: 'ANNULLED' as const,
    annulledAt: MOCK_NOW.toISOString(),
    annulledByUserId: trainerId,
  };

  state = {
    ...state,
    credits: state.credits.map((item) => (item.id === creditId ? updated : item)),
  };
  emit();
  return updated;
}

export function trainerCancelBooking(bookingId: string): {
  generatedCredit: boolean;
} {
  const booking = state.bookings.find((item) => item.id === bookingId);
  if (!booking || booking.status !== 'CONFIRMED') {
    throw new Error('Reserva não pode ser cancelada');
  }

  const slot = state.timeSlots.find((item) => item.id === booking.timeSlotId);
  if (!slot) {
    throw new Error('Horário não encontrado');
  }

  const credit = grantCredit({
    studentId: booking.studentId,
    source: 'TRAINER_CANCELLATION',
    originBookingId: booking.id,
  });

  state = {
    ...state,
    bookings: state.bookings.map((item) =>
      item.id === bookingId ? { ...item, status: 'CANCELLED' } : item,
    ),
    timeSlots: state.timeSlots.map((item) =>
      item.id === slot.id ? releaseSlotSeat(item) : item,
    ),
    credits: [...state.credits, credit],
    cancellations: [
      ...state.cancellations,
      cancellationSchema.parse({
        id: `cancel-${Date.now()}`,
        bookingId: booking.id,
        cancelledAt: MOCK_NOW.toISOString(),
        cancelledBy: 'TRAINER',
        generatedCredit: true,
        creditId: credit.id,
      }),
    ],
  };
  emit();
  return { generatedCredit: true };
}

export function createStudioClosure(input: {
  startsOn: string;
  endsOn: string;
  reason: string;
  grantsCredit: boolean;
  createdByUserId: string;
}): StudioClosure {
  if (input.endsOn < input.startsOn) {
    throw new Error('A data final não pode ser anterior ao início');
  }

  const closure = studioClosureSchema.parse({
    id: `closure-${Date.now()}`,
    startsOn: input.startsOn,
    endsOn: input.endsOn,
    reason: input.reason.trim(),
    createdByUserId: input.createdByUserId,
    grantsCredit: input.grantsCredit,
  });

  const affected = state.bookings.filter((booking) => {
    if (booking.status !== 'CONFIRMED') {
      return false;
    }
    const slot = state.timeSlots.find((item) => item.id === booking.timeSlotId);
    return slot
      ? dateInRange(calendarDate(slot.startsAt), closure.startsOn, closure.endsOn)
      : false;
  });

  const affectedSlotIds = new Set(affected.map((booking) => booking.timeSlotId));
  const credits = [...state.credits];
  const cancellations = [...state.cancellations];

  affected.forEach((booking, index) => {
    let creditId: string | undefined;
    if (input.grantsCredit) {
      const credit = grantCredit({
        studentId: booking.studentId,
        source: 'CLOSURE_COMPENSATION',
        originBookingId: booking.id,
        originClosureId: closure.id,
      });
      credit.id = `${credit.id}-${index}`;
      credits.push(credit);
      creditId = credit.id;
    }
    cancellations.push(
      cancellationSchema.parse({
        id: `cancel-closure-${Date.now()}-${index}`,
        bookingId: booking.id,
        cancelledAt: MOCK_NOW.toISOString(),
        cancelledBy: 'TRAINER',
        generatedCredit: input.grantsCredit,
        creditId,
      }),
    );
  });

  state = {
    ...state,
    closures: [...state.closures, closure],
    bookings: state.bookings.map((booking) =>
      affected.some((item) => item.id === booking.id)
        ? { ...booking, status: 'CANCELLED' }
        : booking,
    ),
    timeSlots: state.timeSlots.map((slot) => {
      if (!affectedSlotIds.has(slot.id)) {
        return slot;
      }
      const cancelledHere = affected.filter((booking) => booking.timeSlotId === slot.id)
        .length;
      const enrolledCount = Math.max(0, slot.enrolledCount - cancelledHere);
      return {
        ...slot,
        enrolledCount,
        status: 'CLOSED',
      };
    }),
    credits,
    cancellations,
  };
  emit();
  return closure;
}

export function addRecurringSlot(input: {
  planId: string;
  weekday: Weekday;
  time: string;
}): RecurringSlot {
  if (!state.plans.some((plan) => plan.id === input.planId)) {
    throw new Error('Plano não encontrado');
  }
  const exists = state.recurringSlots.some(
    (slot) =>
      slot.planId === input.planId &&
      slot.weekday === input.weekday &&
      slot.time === input.time,
  );
  if (exists) {
    throw new Error('Este horário já está na agenda recorrente');
  }

  const slot = recurringSlotSchema.parse({
    id: `rec-${Date.now()}`,
    planId: input.planId,
    weekday: input.weekday,
    time: input.time,
  });

  state = {
    ...state,
    recurringSlots: [...state.recurringSlots, slot],
  };
  emit();
  return slot;
}

export function removeRecurringSlot(slotId: string): void {
  state = {
    ...state,
    recurringSlots: state.recurringSlots.filter((slot) => slot.id !== slotId),
  };
  emit();
}

export function occupancyFromState(): OccupancyDashboard {
  const today = calendarDate(MOCK_NOW.toISOString());
  const todaySlots = state.timeSlots.filter((slot) => slotOnDate(slot, today));
  const todayStudentIds = new Set(
    state.bookings
      .filter((booking) => {
        if (booking.status !== 'CONFIRMED') {
          return false;
        }
        const slot = state.timeSlots.find((item) => item.id === booking.timeSlotId);
        return slot ? slotOnDate(slot, today) : false;
      })
      .map((booking) => booking.studentId),
  );
  const capacity = todaySlots.reduce((sum, slot) => sum + slot.capacity, 0);
  const enrolled = todaySlots.reduce((sum, slot) => sum + slot.enrolledCount, 0);

  const hourMap = new Map<string, { enrolled: number; capacity: number }>();
  const weekdayMap = new Map<Weekday, { enrolled: number; capacity: number }>();

  state.timeSlots.forEach((slot) => {
    const hour = `${clockTime(slot.startsAt).slice(0, 2)}:00`;
    const weekday = WEEKDAY_BY_INDEX[weekdayIndex(slot.startsAt)] ?? 'MON';
    const hourEntry = hourMap.get(hour) ?? { enrolled: 0, capacity: 0 };
    hourEntry.enrolled += slot.enrolledCount;
    hourEntry.capacity += slot.capacity;
    hourMap.set(hour, hourEntry);
    const weekdayEntry = weekdayMap.get(weekday) ?? { enrolled: 0, capacity: 0 };
    weekdayEntry.enrolled += slot.enrolledCount;
    weekdayEntry.capacity += slot.capacity;
    weekdayMap.set(weekday, weekdayEntry);
  });

  const percent = (enrolledCount: number, cap: number): number =>
    cap === 0 ? 0 : Math.round((enrolledCount / cap) * 100);

  return {
    metrics: {
      studentsToday: todayStudentIds.size,
      occupancyPercent: percent(enrolled, capacity),
      freeSpots: Math.max(0, capacity - enrolled),
      cancellations: state.cancellations.length,
      makeups: state.bookings.filter(
        (booking) => booking.kind === 'MAKEUP' && booking.status === 'CONFIRMED',
      ).length,
    },
    byHour: [...hourMap.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([hour, value]) => ({
        hour,
        occupancyPercent: percent(value.enrolled, value.capacity),
      })),
    byWeekday: (['MON', 'TUE', 'WED', 'THU', 'FRI'] as const).map((weekday) => {
      const value = weekdayMap.get(weekday) ?? { enrolled: 0, capacity: 0 };
      return {
        weekday,
        occupancyPercent: percent(value.enrolled, value.capacity),
      };
    }),
  };
}
