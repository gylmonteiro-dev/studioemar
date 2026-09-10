import {
  isCancellationEligibleForCredit,
  isOwnRegularTrainingSlot,
  type Booking,
  type Credit,
  type StudentRegularSlot,
  type TimeSlot,
} from '@studioemar/shared';
import { getClientNow } from './clock';
import { clockTime, weekdayCode } from './format';

export type BookingView = {
  booking: Booking;
  slot: TimeSlot;
};

function pairStudentViews(
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
    .filter((item): item is BookingView => item !== null);
}

export function viewByBookingId(
  bookings: Booking[],
  timeSlots: TimeSlot[],
  bookingId: string,
  studentId?: string,
): BookingView | undefined {
  return pairStudentViews(bookings, timeSlots, studentId).find(
    (item) => item.booking.id === bookingId,
  );
}

export function viewsForStudent(
  bookings: Booking[],
  timeSlots: TimeSlot[],
  studentId?: string,
): BookingView[] {
  const views = pairStudentViews(bookings, timeSlots, studentId);
  const confirmedSlots = new Set(
    views
      .filter((item) => item.booking.status === 'CONFIRMED')
      .map((item) => item.booking.timeSlotId),
  );
  return views
    .filter(
      (item) =>
        !(
          item.booking.status === 'CANCELLED' &&
          confirmedSlots.has(item.booking.timeSlotId)
        ),
    )
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

export function isRegularTrainingSlot(
  slot: TimeSlot,
  regularSlots: readonly StudentRegularSlot[],
): boolean {
  return isOwnRegularTrainingSlot(
    weekdayCode(slot.startsAt),
    clockTime(slot.startsAt),
    regularSlots,
  );
}

export function canRebookRegular(
  booking: Booking,
  slot: TimeSlot,
  regularSlots: readonly StudentRegularSlot[],
  now = getClientNow(),
): boolean {
  return (
    booking.kind === 'REGULAR' &&
    booking.status === 'CANCELLED' &&
    slot.status === 'OPEN' &&
    slot.enrolledCount < slot.capacity &&
    new Date(slot.startsAt).getTime() > now.getTime() &&
    isRegularTrainingSlot(slot, regularSlots)
  );
}
