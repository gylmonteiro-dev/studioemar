import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  bookingParticipantSchema,
  creditExpiresAt,
  isOperatorRole,
  type AddRecurringSlotRequest,
  type CreateStudioClosureRequest,
  type CreateStudioHourRequest,
  type CreateTimeSlotRequest,
  type UpdateStudioHourRequest,
  type UpdateTimeSlotRequest,
  type Weekday,
} from '@studioemar/shared';
import type { AuthUser } from '../auth/auth.types';
import {
  calendarDate,
  clockTimeSaoPaulo,
  dateInRange,
  saoPauloDateTime,
} from '../common/calendar-date';
import { Clock } from '../common/clock';
import {
  toBooking,
  toRecurringSlot,
  toStudioClosure,
  toStudioHour,
  toTimeSlot,
  toUser,
  toWaitlistEntry,
} from '../common/mappers';
import { applySeatChange } from '../domain/slot-occupancy';
import {
  enumerateStudioHourOccurrences,
  sortWeekdays,
} from '../domain/studio-hours';
import { PrismaService } from '../prisma/prisma.service';

type DbClient = Pick<
  PrismaService,
  'timeSlot' | 'studioHour' | 'studioClosure' | 'waitlistEntry' | 'booking'
>;

@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
  ) {}

  async listTimeSlots(actor?: AuthUser) {
    const slots = await this.prisma.timeSlot.findMany({
      where: actor?.role === 'TRAINER' ? { trainerId: actor.id } : undefined,
      orderBy: { startsAt: 'asc' },
    });
    return slots.map(toTimeSlot);
  }

  async getTimeSlot(id: string, actor?: AuthUser) {
    const slot =
      actor?.role === 'TRAINER'
        ? await this.prisma.timeSlot.findFirst({
            where: { id, trainerId: actor.id },
          })
        : await this.prisma.timeSlot.findUnique({ where: { id } });
    if (!slot) {
      throw new NotFoundException('Horário não encontrado');
    }
    return toTimeSlot(slot);
  }

  async listSlotBookings(timeSlotId: string, actor?: AuthUser) {
    await this.getTimeSlot(timeSlotId, actor);
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

  async listWaitlist(timeSlotId: string, actor?: AuthUser) {
    await this.getTimeSlot(timeSlotId, actor);
    const entries = await this.prisma.waitlistEntry.findMany({
      where: { timeSlotId, status: 'WAITING' },
      orderBy: { position: 'asc' },
    });
    return entries.map(toWaitlistEntry);
  }

  async createTimeSlot(input: CreateTimeSlotRequest) {
    await this.requireOperator(input.trainerId);
    const startsAt = saoPauloDateTime(input.date, input.startTime);
    const endsAt = saoPauloDateTime(input.date, input.endTime);
    if (startsAt <= this.clock.now()) {
      throw new BadRequestException('Informe um horário futuro');
    }
    const slot = await this.prisma.timeSlot.create({
      data: {
        startsAt,
        endsAt,
        capacity: input.capacity,
        enrolledCount: 0,
        status: 'OPEN',
        classType: input.classType,
        trainerId: input.trainerId,
      },
    });
    return toTimeSlot(slot);
  }

  async updateTimeSlot(id: string, input: UpdateTimeSlotRequest) {
    const slot = await this.prisma.timeSlot.findUnique({ where: { id } });
    if (!slot) {
      throw new NotFoundException('Horário não encontrado');
    }
    if (input.trainerId) {
      await this.requireOperator(input.trainerId);
    }
    if (input.capacity !== undefined && input.capacity < slot.enrolledCount) {
      throw new BadRequestException(
        'A capacidade não pode ser menor que os alunos já inscritos',
      );
    }

    const nextDate = input.date ?? calendarDate(slot.startsAt);
    const nextStart = input.startTime ?? clockTimeSaoPaulo(slot.startsAt);
    const nextEnd = input.endTime ?? clockTimeSaoPaulo(slot.endsAt);
    const startsAt = saoPauloDateTime(nextDate, nextStart);
    const endsAt = saoPauloDateTime(nextDate, nextEnd);
    const scheduleChanged =
      startsAt.getTime() !== slot.startsAt.getTime() ||
      endsAt.getTime() !== slot.endsAt.getTime();

    if (scheduleChanged && slot.enrolledCount > 0) {
      throw new ConflictException(
        'Há alunos inscritos neste horário. Cancele as reservas antes de alterar o dia ou a hora.',
      );
    }
    if (scheduleChanged && endsAt <= startsAt) {
      throw new BadRequestException('O término deve ser depois do início');
    }

    return this.prisma.$transaction(async (tx) => {
      const capacity = input.capacity ?? slot.capacity;
      const next = applySeatChange({ ...slot, capacity }, 0);
      const updated = await tx.timeSlot.update({
        where: { id },
        data: {
          ...(scheduleChanged ? { startsAt, endsAt } : {}),
          capacity,
          enrolledCount: next.enrolledCount,
          status: slot.status === 'CLOSED' ? 'CLOSED' : next.status,
          classType: input.classType ?? slot.classType,
          trainerId: input.trainerId ?? slot.trainerId,
        },
      });
      return toTimeSlot(updated);
    });
  }

  async deleteTimeSlot(id: string) {
    const slot = await this.prisma.timeSlot.findUnique({ where: { id } });
    if (!slot) {
      throw new NotFoundException('Horário não encontrado');
    }
    await this.prisma.$transaction(async (tx) => {
      await this.removeEmptySlot(tx, slot);
    });
  }

  async listStudioHours() {
    const hours = await this.prisma.studioHour.findMany({
      orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
    });
    return hours.map(toStudioHour);
  }

  async createStudioHour(input: CreateStudioHourRequest) {
    await this.requireOperator(input.trainerId);
    return this.prisma.$transaction(async (tx) => {
      const hour = await tx.studioHour.create({
        data: {
          weekdays: sortWeekdays(input.weekdays),
          startTime: input.startTime,
          endTime: input.endTime,
          capacity: input.capacity,
          classType: input.classType,
          trainerId: input.trainerId,
        },
      });
      await this.materializeStudioHour(tx, hour);
      return toStudioHour(hour);
    });
  }

  async updateStudioHour(id: string, input: UpdateStudioHourRequest) {
    const hour = await this.prisma.studioHour.findUnique({ where: { id } });
    if (!hour) {
      throw new NotFoundException('Horário do estúdio não encontrado');
    }
    if (input.trainerId) {
      await this.requireOperator(input.trainerId);
    }

    const weekdays = sortWeekdays((input.weekdays ?? hour.weekdays) as Weekday[]);
    const startTime = input.startTime ?? hour.startTime;
    const endTime = input.endTime ?? hour.endTime;
    if (endTime <= startTime) {
      throw new BadRequestException('O término deve ser depois do início');
    }

    const scheduleChanged =
      startTime !== hour.startTime ||
      endTime !== hour.endTime ||
      weekdays.join() !== hour.weekdays.join();

    return this.prisma.$transaction(async (tx) => {
      if (scheduleChanged) {
        await this.clearFutureGeneratedSlots(tx, id, true);
      }

      const updated = await tx.studioHour.update({
        where: { id },
        data: {
          weekdays,
          startTime,
          endTime,
          capacity: input.capacity ?? hour.capacity,
          classType: input.classType ?? hour.classType,
          trainerId: input.trainerId ?? hour.trainerId,
        },
      });

      if (scheduleChanged) {
        await this.materializeStudioHour(tx, updated);
      } else {
        await this.propagateStudioHourDetails(tx, updated);
      }

      return toStudioHour(updated);
    });
  }

  async deleteStudioHour(id: string) {
    const hour = await this.prisma.studioHour.findUnique({ where: { id } });
    if (!hour) {
      throw new NotFoundException('Horário do estúdio não encontrado');
    }
    await this.prisma.$transaction(async (tx) => {
      await this.clearFutureGeneratedSlots(tx, id, true);
      await tx.studioHour.delete({ where: { id } });
    });
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

  private async requireOperator(trainerId: string) {
    const trainer = await this.prisma.user.findUnique({
      where: { id: trainerId },
    });
    if (
      !trainer ||
      !isOperatorRole(trainer.role) ||
      trainer.isActive === false
    ) {
      throw new NotFoundException('Treinador não encontrado');
    }
  }

  private async materializeStudioHour(
    tx: DbClient,
    hour: {
      id: string;
      weekdays: Weekday[];
      startTime: string;
      endTime: string;
      capacity: number;
      classType: string;
      trainerId: string;
    },
  ) {
    const closures = await tx.studioClosure.findMany();
    const occurrences = enumerateStudioHourOccurrences({
      weekdays: hour.weekdays,
      startTime: hour.startTime,
      endTime: hour.endTime,
      from: this.clock.now(),
    });

    for (const occurrence of occurrences) {
      const closed = closures.some((closure) =>
        dateInRange(
          occurrence.date,
          dateOnly(closure.startsOn),
          dateOnly(closure.endsOn),
        ),
      );
      if (closed) {
        continue;
      }
      await tx.timeSlot.create({
        data: {
          startsAt: occurrence.startsAt,
          endsAt: occurrence.endsAt,
          capacity: hour.capacity,
          enrolledCount: 0,
          status: 'OPEN',
          classType: hour.classType,
          trainerId: hour.trainerId,
          studioHourId: hour.id,
        },
      });
    }
  }

  private async propagateStudioHourDetails(
    tx: DbClient,
    hour: {
      id: string;
      capacity: number;
      classType: string;
      trainerId: string;
    },
  ) {
    const now = this.clock.now();
    const slots = (await tx.timeSlot.findMany()).filter(
      (slot) => slot.studioHourId === hour.id && slot.startsAt > now,
    );
    for (const slot of slots) {
      if (hour.capacity < slot.enrolledCount) {
        throw new BadRequestException(
          'A capacidade não pode ser menor que os alunos já inscritos',
        );
      }
      const next = applySeatChange({ ...slot, capacity: hour.capacity }, 0);
      await tx.timeSlot.update({
        where: { id: slot.id },
        data: {
          capacity: hour.capacity,
          classType: hour.classType,
          trainerId: hour.trainerId,
          enrolledCount: next.enrolledCount,
          status: slot.status === 'CLOSED' ? 'CLOSED' : next.status,
        },
      });
    }
  }

  private async clearFutureGeneratedSlots(
    tx: DbClient,
    studioHourId: string,
    requireEmpty: boolean,
  ) {
    const now = this.clock.now();
    const slots = (await tx.timeSlot.findMany()).filter(
      (slot) => slot.studioHourId === studioHourId && slot.startsAt > now,
    );
    for (const slot of slots) {
      if (requireEmpty && slot.enrolledCount > 0) {
        throw new ConflictException(
          'Há aulas futuras com alunos inscritos. Cancele as reservas antes de alterar os dias ou o horário.',
        );
      }
      if (slot.enrolledCount > 0) {
        continue;
      }
      await this.removeEmptySlot(tx, slot);
    }
  }

  private async removeEmptySlot(
    tx: DbClient,
    slot: { id: string; enrolledCount: number },
  ) {
    if (slot.enrolledCount > 0) {
      throw new ConflictException(
        'Há alunos inscritos neste horário. Cancele as reservas antes de excluir.',
      );
    }
    const booking = await tx.booking.findFirst({
      where: { timeSlotId: slot.id },
    });
    await tx.waitlistEntry.deleteMany({ where: { timeSlotId: slot.id } });
    if (booking) {
      await tx.timeSlot.update({
        where: { id: slot.id },
        data: { status: 'CLOSED', studioHourId: null },
      });
      return;
    }
    await tx.timeSlot.delete({ where: { id: slot.id } });
  }
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
