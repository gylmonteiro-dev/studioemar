import {
  isCancellationEligibleForCredit,
  type Booking,
  type Credit,
  type TimeSlot,
} from '@studioemar/shared';
import { getClientNow } from './clock';

export type BookingView = {
  booking: Booking;
  slot: TimeSlot;
};

export function viewsForStudent(
  bookings: Booking[],
  timeSlots: TimeSlot[],
  studentId?: string,
): BookingView[] {
  const slotsById = new Map(timeSlots.map((slot) => [slot.id, slot]));
  return bookings
    .filter((booking) => !studentId || booking.studentId === studentId)
    .map((booking) => {
      const slot = slotsById.get(booking.timeSlotId);
      if (!slot) {
        return null;
      }
      return { booking, slot };
    })
    .filter((item): item is BookingView => item !== null)
    .sort(
      (left, right) =>
        new Date(left.slot.startsAt).getTime() -
        new Date(right.slot.startsAt).getTime(),
    );
}

export function upcomingConfirmed(
  bookings: Booking[],
  timeSlots: TimeSlot[],
  studentId: string,
  now = getClientNow(),
): BookingView[] {
  const timestamp = now.getTime();
  return viewsForStudent(bookings, timeSlots, studentId).filter(
    (item) =>
      item.booking.status === 'CONFIRMED' &&
      new Date(item.slot.startsAt).getTime() >= timestamp,
  );
}

export function availableCredits(credits: Credit[]): Credit[] {
  return credits.filter((credit) => credit.status === 'AVAILABLE');
}

export function oldestAvailableCredit(credits: Credit[]): Credit | undefined {
  return availableCredits(credits)
    .slice()
    .sort(
      (left, right) =>
        new Date(left.expiresAt).getTime() - new Date(right.expiresAt).getTime(),
    )[0];
}

export function isEligibleToCredit(startsAt: string, now = getClientNow()): boolean {
  return isCancellationEligibleForCredit(now, new Date(startsAt));
}
