import type {
  Booking as PrismaBooking,
  Cancellation as PrismaCancellation,
  ClassType as PrismaClassType,
  Credit as PrismaCredit,
  Plan as PrismaPlan,
  RecurringSlot as PrismaRecurringSlot,
  StudioClosure as PrismaStudioClosure,
  StudioHour as PrismaStudioHour,
  TimeSlot as PrismaTimeSlot,
  WaitlistEntry as PrismaWaitlistEntry,
} from '@prisma/client';
import {
  bookingSchema,
  cancellationSchema,
  classTypeSchema,
  creditSchema,
  planMetrics,
  planSchema,
  recurringSlotSchema,
  studioClosureSchema,
  studioHourSchema,
  timeSlotSchema,
  userSchema,
  waitlistEntrySchema,
  type Booking,
  type Cancellation,
  type ClassType,
  type Credit,
  type Plan,
  type RecurringSlot,
  type StudioClosure,
  type StudioHour,
  type StudentRegularSlot,
  type TimeSlot,
  type User,
  type WaitlistEntry,
  type Weekday,
} from '@studioemar/shared';
import { WEEKDAY_ORDER } from '../domain/studio-hours';

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function toUser(
  row: {
    id: string;
    name: string;
    email: string;
    role: User['role'] | string;
    planId?: string | null;
    cpf?: string | null;
    mustSetPassword: boolean;
    isActive?: boolean;
  },
  trainerIds: string[] = [],
  regularSlots: StudentRegularSlot[] = [],
): User {
  return userSchema.parse({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    ...(row.planId ? { planId: row.planId } : {}),
    ...(row.cpf ? { cpf: row.cpf } : {}),
    trainerIds,
    regularSlots,
    mustSetPassword: row.mustSetPassword,
    isActive: row.isActive,
  });
}

export function toRegularSlotsFromRows(
  rows: Array<{
    studioHourId: string;
    weekday: string;
    studioHour?: {
      name: string;
      startTime: string;
      endTime: string;
      classType: string;
      trainerId: string;
    } | null;
  }>,
): StudentRegularSlot[] {
  return rows
    .filter(
      (
        row,
      ): row is typeof row & {
        studioHour: NonNullable<(typeof row)['studioHour']>;
      } => Boolean(row.studioHour),
    )
    .map((row) => ({
      studioHourId: row.studioHourId,
      weekday: row.weekday as Weekday,
      name: row.studioHour.name,
      startTime: row.studioHour.startTime,
      endTime: row.studioHour.endTime,
      classType: row.studioHour.classType,
      trainerId: row.studioHour.trainerId,
    }))
    .sort(
      (left, right) =>
        WEEKDAY_ORDER.indexOf(left.weekday) -
        WEEKDAY_ORDER.indexOf(right.weekday),
    );
}

export function toPlan(row: PrismaPlan): Plan {
  const sessionMinutes = row.sessionMinutes;
  const weeklyFrequency = row.weeklyFrequency;
  return planSchema.parse({
    id: row.id,
    name: row.name,
    weeklyFrequency,
    sessionMinutes,
    price: row.price === null ? null : Number(row.price),
    ...planMetrics({ weeklyFrequency, sessionMinutes }),
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

export function toClassType(row: PrismaClassType): ClassType {
  return classTypeSchema.parse({
    id: row.id,
    name: row.name,
  });
}

export function toStudioHour(row: PrismaStudioHour): StudioHour {
  return studioHourSchema.parse({
    id: row.id,
    name: row.name,
    weekdays: row.weekdays,
    startTime: row.startTime,
    endTime: row.endTime,
    capacity: row.capacity,
    classType: row.classType,
    trainerId: row.trainerId,
  });
}

export function toTimeSlot(row: PrismaTimeSlot): TimeSlot {
  return timeSlotSchema.parse({
    id: row.id,
    name: row.name,
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
