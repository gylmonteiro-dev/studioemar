import type { PrismaClient } from '@prisma/client';
import {
  mockBookings,
  mockCancellations,
  mockCredits,
  mockPlan,
  mockRecurringSlots,
  mockStudioClosure,
  mockTimeSlots,
  mockUsers,
  mockWaitlistEntry,
} from '@studioemar/shared/mocks';

type DemoUserOverride = {
  name?: string;
  email?: string;
  mustSetPassword?: boolean;
  passwordHash?: string | null;
};

export type DemoSeedOptions = {
  defaultPasswordHash: string;
  users?: Partial<Record<(typeof mockUsers)[number]['id'], DemoUserOverride>>;
};

export function buildDemoUsers(options: DemoSeedOptions) {
  return mockUsers.map((user) => {
    const override = options.users?.[user.id];
    const mustSetPassword = override?.mustSetPassword ?? user.mustSetPassword;

    return {
      id: user.id,
      name: override?.name ?? user.name,
      email: (override?.email ?? user.email).toLowerCase(),
      role: user.role,
      planId: user.planId,
      mustSetPassword,
      passwordHash:
        override?.passwordHash ??
        (mustSetPassword ? null : options.defaultPasswordHash),
    };
  });
}

/** Substitui todo o banco pelas fixtures determinísticas de demonstração. */
export async function replaceWithDemoData(
  prisma: PrismaClient,
  options: DemoSeedOptions,
): Promise<void> {
  await prisma.cancellation.deleteMany();
  await prisma.credit.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.studioClosure.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.recurringSlot.deleteMany();
  await prisma.user.deleteMany();
  await prisma.plan.deleteMany();

  await prisma.plan.create({
    data: {
      id: mockPlan.id,
      name: mockPlan.name,
      weeklyFrequency: mockPlan.weeklyFrequency,
    },
  });

  await prisma.user.createMany({ data: buildDemoUsers(options) });

  await prisma.recurringSlot.createMany({
    data: mockRecurringSlots.map((slot) => ({
      id: slot.id,
      planId: slot.planId,
      weekday: slot.weekday,
      time: slot.time,
    })),
  });

  await prisma.timeSlot.createMany({
    data: mockTimeSlots.map((slot) => ({
      id: slot.id,
      startsAt: new Date(slot.startsAt),
      endsAt: new Date(slot.endsAt),
      capacity: slot.capacity,
      enrolledCount: slot.enrolledCount,
      status: slot.status,
      classType: slot.classType,
      trainerId: slot.trainerId,
    })),
  });

  await prisma.booking.createMany({
    data: mockBookings.map((booking) => ({
      id: booking.id,
      studentId: booking.studentId,
      timeSlotId: booking.timeSlotId,
      kind: booking.kind,
      status: booking.status,
    })),
  });

  await prisma.studioClosure.create({
    data: {
      id: mockStudioClosure.id,
      startsOn: new Date(mockStudioClosure.startsOn),
      endsOn: new Date(mockStudioClosure.endsOn),
      reason: mockStudioClosure.reason,
      createdByUserId: mockStudioClosure.createdByUserId,
      grantsCredit: mockStudioClosure.grantsCredit,
    },
  });

  await prisma.credit.createMany({
    data: mockCredits.map((credit) => ({
      id: credit.id,
      studentId: credit.studentId,
      source: credit.source,
      generatedAt: new Date(credit.generatedAt),
      originBookingId: credit.originBookingId,
      originClosureId: credit.originClosureId,
      expiresAt: new Date(credit.expiresAt),
      status: credit.status,
      usedAt: credit.usedAt ? new Date(credit.usedAt) : null,
      usedBookingId: credit.usedBookingId,
      annulledAt: credit.annulledAt ? new Date(credit.annulledAt) : null,
      annulledByUserId: credit.annulledByUserId,
    })),
  });

  await prisma.cancellation.createMany({
    data: mockCancellations.map((cancellation) => ({
      id: cancellation.id,
      bookingId: cancellation.bookingId,
      cancelledAt: new Date(cancellation.cancelledAt),
      cancelledBy: cancellation.cancelledBy,
      generatedCredit: cancellation.generatedCredit,
      creditId: cancellation.creditId,
    })),
  });

  await prisma.waitlistEntry.create({
    data: {
      id: mockWaitlistEntry.id,
      timeSlotId: mockWaitlistEntry.timeSlotId,
      studentId: mockWaitlistEntry.studentId,
      position: mockWaitlistEntry.position,
      enqueuedAt: new Date(mockWaitlistEntry.enqueuedAt),
      status: mockWaitlistEntry.status,
    },
  });
}
