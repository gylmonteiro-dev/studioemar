'use client';

import {
  creditExpiresAt,
  creditSchema,
  cancellationSchema,
  bookingSchema,
  isCancellationEligibleForCredit,
  type Booking,
  type Cancellation,
  type Credit,
  type TimeSlot,
  type User,
} from '@studioemar/shared';
import {
  MOCK_NOW,
  mockBookings,
  mockCancellations,
  mockCredits,
  mockTimeSlots,
  mockTrainer,
  mockUsers,
} from '@studioemar/shared/mocks';
import { useSyncExternalStore } from 'react';

type StudioState = {
  users: User[];
  bookings: Booking[];
  credits: Credit[];
  cancellations: Cancellation[];
  timeSlots: TimeSlot[];
};

const listeners = new Set<() => void>();
let version = 0;

let state: StudioState = {
  users: mockUsers.map((user) => ({ ...user })),
  bookings: mockBookings.map((item) => ({ ...item })),
  credits: mockCredits.map((item) => ({ ...item })),
  cancellations: mockCancellations.map((item) => ({ ...item })),
  timeSlots: mockTimeSlots.map((item) => ({ ...item })),
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
