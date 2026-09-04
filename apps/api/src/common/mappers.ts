import type {
  Booking as PrismaBooking,
  Cancellation as PrismaCancellation,
  Credit as PrismaCredit,
  Plan as PrismaPlan,
  RecurringSlot as PrismaRecurringSlot,
  StudioClosure as PrismaStudioClosure,
  TimeSlot as PrismaTimeSlot,
  User as PrismaUser,
  WaitlistEntry as PrismaWaitlistEntry,
} from '@prisma/client';
import {
  bookingSchema,
  cancellationSchema,
  creditSchema,
  planSchema,
  recurringSlotSchema,
  studioClosureSchema,
  timeSlotSchema,
  userSchema,
  waitlistEntrySchema,
  type Booking,
  type Cancellation,
  type Credit,
  type Plan,
  type RecurringSlot,
  type StudioClosure,
  type TimeSlot,
  type User,
  type WaitlistEntry,
} from '@studioemar/shared';

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function toUser(
  row: Pick<
    PrismaUser,
    'id' | 'name' | 'email' | 'role' | 'planId' | 'mustSetPassword'
  >,
): User {
  return userSchema.parse({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    ...(row.planId ? { planId: row.planId } : {}),
    mustSetPassword: row.mustSetPassword,
  });
}

export function toPlan(row: PrismaPlan): Plan {
  return planSchema.parse({
    id: row.id,
    name: row.name,
    weeklyFrequency: row.weeklyFrequency,
  });
}

export function toRecurringSlot(row: PrismaRecurringSlot): RecurringSlot {
  return recurringSlotSchema.parse({
    id: row.id,
    planId: row.planId,
    weekday: row.weekday,
    time: row.time,
  });
}

export function toTimeSlot(row: PrismaTimeSlot): TimeSlot {
  return timeSlotSchema.parse({
    id: row.id,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    capacity: row.capacity,
    enrolledCount: row.enrolledCount,
    status: row.status,
    classType: row.classType,
    trainerId: row.trainerId,
  });
}

export function toStudioClosure(row: PrismaStudioClosure): StudioClosure {
  return studioClosureSchema.parse({
    id: row.id,
    startsOn: dateOnly(row.startsOn),
    endsOn: dateOnly(row.endsOn),
    reason: row.reason,
    createdByUserId: row.createdByUserId,
    grantsCredit: row.grantsCredit,
  });
}

export function toWaitlistEntry(row: PrismaWaitlistEntry): WaitlistEntry {
  return waitlistEntrySchema.parse({
    id: row.id,
    timeSlotId: row.timeSlotId,
    studentId: row.studentId,
    position: row.position,
    enqueuedAt: row.enqueuedAt.toISOString(),
    status: row.status,
  });
}

export function toBooking(row: PrismaBooking): Booking {
  return bookingSchema.parse({
    id: row.id,
    studentId: row.studentId,
    timeSlotId: row.timeSlotId,
    kind: row.kind,
    status: row.status,
  });
}

export function toCancellation(row: PrismaCancellation): Cancellation {
  return cancellationSchema.parse({
    id: row.id,
    bookingId: row.bookingId,
    cancelledAt: row.cancelledAt.toISOString(),
    cancelledBy: row.cancelledBy,
    generatedCredit: row.generatedCredit,
    ...(row.creditId ? { creditId: row.creditId } : {}),
  });
}

export function toCredit(row: PrismaCredit): Credit {
  return creditSchema.parse({
    id: row.id,
    studentId: row.studentId,
    source: row.source,
    generatedAt: row.generatedAt.toISOString(),
    ...(row.originBookingId ? { originBookingId: row.originBookingId } : {}),
    ...(row.originClosureId ? { originClosureId: row.originClosureId } : {}),
    expiresAt: row.expiresAt.toISOString(),
    status: row.status,
    ...(row.usedAt ? { usedAt: row.usedAt.toISOString() } : {}),
    ...(row.usedBookingId ? { usedBookingId: row.usedBookingId } : {}),
    ...(row.annulledAt ? { annulledAt: row.annulledAt.toISOString() } : {}),
    ...(row.annulledByUserId ? { annulledByUserId: row.annulledByUserId } : {}),
  });
}
