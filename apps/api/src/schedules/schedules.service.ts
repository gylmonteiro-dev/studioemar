import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  bookingParticipantSchema,
  creditExpiresAt,
  type AddRecurringSlotRequest,
  type CreateStudioClosureRequest,
} from '@studioemar/shared';
import { calendarDate, dateInRange } from '../common/calendar-date';
import { Clock } from '../common/clock';
import {
  toBooking,
  toRecurringSlot,
  toStudioClosure,
  toTimeSlot,
  toUser,
  toWaitlistEntry,
} from '../common/mappers';
import { applySeatChange } from '../domain/slot-occupancy';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
  ) {}

  async listTimeSlots() {
    const slots = await this.prisma.timeSlot.findMany({
      orderBy: { startsAt: 'asc' },
    });
    return slots.map(toTimeSlot);
  }

  async getTimeSlot(id: string) {
    const slot = await this.prisma.timeSlot.findUnique({ where: { id } });
    if (!slot) {
      throw new NotFoundException('Horário não encontrado');
    }
    return toTimeSlot(slot);
  }

  async listSlotBookings(timeSlotId: string) {
    await this.getTimeSlot(timeSlotId);
    const bookings = await this.prisma.booking.findMany({
      where: { timeSlotId },
      include: { student: true },
      orderBy: { id: 'asc' },
    });
    return bookings.map((row) =>
      bookingParticipantSchema.parse({
        booking: toBooking(row),
        student: toUser(row.student),
      }),
    );
  }

  async listWaitlist(timeSlotId: string) {
    await this.getTimeSlot(timeSlotId);
    const entries = await this.prisma.waitlistEntry.findMany({
      where: { timeSlotId, status: 'WAITING' },
      orderBy: { position: 'asc' },
    });
    return entries.map(toWaitlistEntry);
  }

  async listRecurringSlots() {
    const slots = await this.prisma.recurringSlot.findMany({
      orderBy: [{ weekday: 'asc' }, { time: 'asc' }],
    });
    return slots.map(toRecurringSlot);
  }

  async addRecurringSlot(input: AddRecurringSlotRequest) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: input.planId },
    });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    const exists = await this.prisma.recurringSlot.findUnique({
      where: {
        planId_weekday_time: {
          planId: input.planId,
          weekday: input.weekday,
          time: input.time,
        },
      },
    });
    if (exists) {
      throw new ConflictException('Este horário já está na agenda recorrente');
    }

    const slot = await this.prisma.recurringSlot.create({
      data: {
        planId: input.planId,
        weekday: input.weekday,
        time: input.time,
      },
    });
    return toRecurringSlot(slot);
  }

  async removeRecurringSlot(slotId: string) {
    const slot = await this.prisma.recurringSlot.findUnique({
      where: { id: slotId },
    });
    if (!slot) {
      throw new NotFoundException('Horário recorrente não encontrado');
    }
    await this.prisma.recurringSlot.delete({ where: { id: slotId } });
  }

  async listClosures() {
    const closures = await this.prisma.studioClosure.findMany({
      orderBy: { startsOn: 'desc' },
    });
    return closures.map(toStudioClosure);
  }

  async createClosure(
    input: CreateStudioClosureRequest,
    createdByUserId: string,
  ) {
    const now = this.clock.now();

    return this.prisma.$transaction(async (tx) => {
      const closure = await tx.studioClosure.create({
        data: {
          startsOn: new Date(`${input.startsOn}T00:00:00.000Z`),
          endsOn: new Date(`${input.endsOn}T00:00:00.000Z`),
          reason: input.reason.trim(),
          createdByUserId,
          grantsCredit: input.grantsCredit,
        },
      });

      const confirmed = await tx.booking.findMany({
        where: { status: 'CONFIRMED' },
        include: { timeSlot: true },
      });
      const affected = confirmed.filter((booking) =>
        dateInRange(
          calendarDate(booking.timeSlot.startsAt),
          input.startsOn,
          input.endsOn,
        ),
      );
      const affectedSlotIds = [...new Set(affected.map((row) => row.timeSlotId))];

      for (const booking of affected) {
        let creditId: string | undefined;
        if (input.grantsCredit) {
          const credit = await tx.credit.create({
            data: {
              studentId: booking.studentId,
              source: 'CLOSURE_COMPENSATION',
              generatedAt: now,
              originBookingId: booking.id,
              originClosureId: closure.id,
              expiresAt: creditExpiresAt(now),
              status: 'AVAILABLE',
            },
          });
          creditId = credit.id;
        }

        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'CANCELLED' },
        });
        await tx.cancellation.create({
          data: {
            bookingId: booking.id,
            cancelledAt: now,
            cancelledBy: 'TRAINER',
            generatedCredit: input.grantsCredit,
            creditId,
          },
        });
      }

      for (const slotId of affectedSlotIds) {
        const slot = await tx.timeSlot.findUniqueOrThrow({
          where: { id: slotId },
        });
        const cancelledHere = affected.filter(
          (booking) => booking.timeSlotId === slotId,
        ).length;
        const next = applySeatChange(slot, -cancelledHere);
        await tx.timeSlot.update({
          where: { id: slotId },
          data: { enrolledCount: next.enrolledCount, status: 'CLOSED' },
        });
      }

      return toStudioClosure(closure);
    });
  }
}
