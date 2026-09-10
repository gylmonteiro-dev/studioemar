import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  bookingParticipantSchema,
  canActAsRole,
  creditExpiresAt,
  isOperatorRole,
  normalizeClassTypeName,
  type AddRecurringSlotRequest,
  type CancelTimeSlotRequest,
  type CreateClassTypeRequest,
  type CreateStudioClosureRequest,
  type CreateStudioHourRequest,
  type CreateTimeSlotRequest,
  type UpdateStudioHourRequest,
  type UpdateTimeSlotRequest,
  type Weekday,
  isoDateSchema,
} from '@studioemar/shared';
import type { AuthUser } from '../auth/auth.types';
import {
  calendarDate,
  civilRangeBounds,
  clockTimeSaoPaulo,
  dateInRange,
  saoPauloDateTime,
  weekdayFromCalendarDate,
} from '../common/calendar-date';
import { Clock } from '../common/clock';
import {
  toBooking,
  toClassType,
  toRecurringSlot,
  toStudioClosure,
  toStudioHour,
  toTimeSlot,
  toUser,
  toWaitlistEntry,
} from '../common/mappers';
import { applySeatChange, isSlotBookable } from '../domain/slot-occupancy';
import {
  enumerateStudioHourOccurrences,
  lookAheadEndDate,
  sortWeekdays,
} from '../domain/studio-hours';
import { PrismaService } from '../prisma/prisma.service';

type DbClient = Pick<
  PrismaService,
  | 'timeSlot'
  | 'studioHour'
  | 'studioClosure'
  | 'waitlistEntry'
  | 'booking'
  | 'cancellation'
  | 'credit'
  | 'studentRegularSlot'
  | 'user'
>;

export type TimeSlotRange = {
  from: string;
  to: string;
};

@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
  ) {}

  async listTimeSlots(actor?: AuthUser, range?: TimeSlotRange) {
    const window = parseTimeSlotRange(range);
    const now = this.clock.now();
    const from = window?.from ?? calendarDate(now);
    const to = window?.to ?? lookAheadEndDate(now);
    if (window) {
      await this.ensureGeneratedRange(this.prisma, window.from, window.to);
    } else {
      await this.ensureLookAhead();
    }

    const slots = await this.prisma.timeSlot.findMany({
      where: {
        startsAt: civilRangeBounds(from, to),
        ...(actor?.role === 'TRAINER' ? { trainerId: actor.id } : {}),
      },
      orderBy: { startsAt: 'asc' },
    });
    return slots.map(toTimeSlot);
  }

  async ensureLookAhead() {
    const now = this.clock.now();
    await this.ensureGeneratedRange(
      this.prisma,
      calendarDate(now),
      lookAheadEndDate(now),
    );
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
    const classType = await this.requireClassType(input.classType);
    const startsAt = saoPauloDateTime(input.date, input.startTime);
    const endsAt = saoPauloDateTime(input.date, input.endTime);
    if (startsAt <= this.clock.now()) {
      throw new BadRequestException('Informe um horário futuro');
    }
    const slot = await this.prisma.timeSlot.create({
      data: {
        name: input.name,
        startsAt,
        endsAt,
        capacity: input.capacity,
        enrolledCount: 0,
        status: 'OPEN',
        classType,
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
    if (input.classType) {
      await this.requireClassType(input.classType);
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
          classType: input.classType
            ? normalizeClassTypeName(input.classType)
            : slot.classType,
          trainerId: input.trainerId ?? slot.trainerId,
          name: input.name ?? slot.name,
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

  async cancelOccurrence(
    id: string,
    actor: AuthUser,
    input: CancelTimeSlotRequest,
  ) {
    const slot = await this.prisma.timeSlot.findUnique({ where: { id } });
    if (!slot) {
      throw new NotFoundException('Horário não encontrado');
    }
    if (
      actor.role === 'TRAINER' &&
      slot.trainerId !== actor.id &&
      !canActAsRole(actor.role, ['ADMIN'])
    ) {
      throw new ForbiddenException('Sem permissão para cancelar esta aula');
    }
    if (slot.status === 'CLOSED') {
      throw new ConflictException('Esta aula já está indisponível');
    }

    const now = this.clock.now();
    return this.prisma.$transaction(async (tx) => {
      const confirmed = await tx.booking.findMany({
        where: { timeSlotId: slot.id, status: 'CONFIRMED' },
        include: { timeSlot: true },
      });
      for (const booking of confirmed) {
        let creditId: string | undefined;
        if (input.grantsCredit) {
          const credit = await tx.credit.create({
            data: {
              studentId: booking.studentId,
              source: 'TRAINER_CANCELLATION',
              generatedAt: now,
              originBookingId: booking.id,
              expiresAt: creditExpiresAt(booking.timeSlot.startsAt),
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
      const next = applySeatChange(slot, -confirmed.length);
      const updated = await tx.timeSlot.update({
        where: { id: slot.id },
        data: { enrolledCount: next.enrolledCount, status: 'CLOSED' },
      });
      return toTimeSlot(updated);
    });
  }

  async listClassTypes() {
    const types = await this.prisma.classType.findMany({
      orderBy: { name: 'asc' },
    });
    return types.map(toClassType);
  }

  async createClassType(input: CreateClassTypeRequest) {
    const name = normalizeClassTypeName(input.name);
    const existing = await this.prisma.classType.findUnique({
      where: { name },
    });
    if (existing) {
      throw new ConflictException('Já existe um tipo de aula com este nome');
    }
    const created = await this.prisma.classType.create({
      data: { name },
    });
    return toClassType(created);
  }

  async listStudioHours() {
    const hours = await this.prisma.studioHour.findMany({
      orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
    });
    return hours.map(toStudioHour);
  }

  async createStudioHour(input: CreateStudioHourRequest) {
    await this.requireOperator(input.trainerId);
    const classType = await this.requireClassType(input.classType);
    return this.prisma.$transaction(async (tx) => {
      const hour = await tx.studioHour.create({
        data: {
          name: input.name,
          weekdays: sortWeekdays(input.weekdays),
          startTime: input.startTime,
          endTime: input.endTime,
          capacity: input.capacity,
          classType,
          trainerId: input.trainerId,
        },
      });
      await this.ensureGeneratedRange(
        tx,
        calendarDate(this.clock.now()),
        lookAheadEndDate(this.clock.now()),
      );
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
    if (input.classType) {
      await this.requireClassType(input.classType);
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

    if (scheduleChanged) {
      await this.assertCanMutateEnrolledHour(id, input.confirmWithEnrolled);
    }

    return this.prisma.$transaction(async (tx) => {
      if (scheduleChanged) {
        await this.clearFutureGeneratedSlots(tx, id, {
          requireEmpty: false,
          cancelBookings: true,
        });
      }

      const updated = await tx.studioHour.update({
        where: { id },
        data: {
          name: input.name ?? hour.name,
          weekdays,
          startTime,
          endTime,
          capacity: input.capacity ?? hour.capacity,
          classType: input.classType
            ? normalizeClassTypeName(input.classType)
            : hour.classType,
          trainerId: input.trainerId ?? hour.trainerId,
        },
      });

      if (scheduleChanged) {
        await tx.studentRegularSlot.deleteMany({
          where: {
            studioHourId: id,
            weekday: { notIn: weekdays },
          },
        });
      }

      if (scheduleChanged) {
        await this.ensureGeneratedRange(
          tx,
          calendarDate(this.clock.now()),
          lookAheadEndDate(this.clock.now()),
        );
      } else {
        await this.propagateStudioHourDetails(tx, updated);
      }

      return toStudioHour(updated);
    });
  }

  async deleteStudioHour(id: string, confirmWithEnrolled = false) {
    const hour = await this.prisma.studioHour.findUnique({ where: { id } });
    if (!hour) {
      throw new NotFoundException('Horário do estúdio não encontrado');
    }
    await this.assertCanMutateEnrolledHour(id, confirmWithEnrolled);
    await this.prisma.$transaction(async (tx) => {
      await this.clearFutureGeneratedSlots(tx, id, {
        requireEmpty: false,
        cancelBookings: true,
      });
      await tx.studentRegularSlot.deleteMany({ where: { studioHourId: id } });
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
              expiresAt: creditExpiresAt(booking.timeSlot.startsAt),
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

  private async requireClassType(name: string) {
    const normalized = normalizeClassTypeName(name);
    const type = await this.prisma.classType.findUnique({
      where: { name: normalized },
    });
    if (!type) {
      throw new BadRequestException(
        'Cadastre o tipo de aula antes de usar neste horário',
      );
    }
    return normalized;
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

  async ensureGeneratedRange(
    tx: DbClient,
    startDate: string,
    until: string,
  ) {
    if (until < startDate) {
      return;
    }
    const now = this.clock.now();
    const bounds = civilRangeBounds(startDate, until);
    const [hours, closures, existing] = await Promise.all([
      tx.studioHour.findMany(),
      tx.studioClosure.findMany(),
      tx.timeSlot.findMany({
        where: {
          studioHourId: { not: null },
          startsAt: bounds,
        },
      }),
    ]);
    const existingByKey = new Map(
      existing
        .filter((slot) => slot.studioHourId)
        .map((slot) => [
          `${slot.studioHourId}|${slot.startsAt.toISOString()}`,
          slot,
        ]),
    );

    for (const hour of hours) {
      const occurrences = enumerateStudioHourOccurrences({
        weekdays: hour.weekdays as Weekday[],
        startTime: hour.startTime,
        endTime: hour.endTime,
        from: now,
        startDate,
        until,
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
        const key = `${hour.id}|${occurrence.startsAt.toISOString()}`;
        let slot = existingByKey.get(key);
        let created = false;
        if (!slot) {
          slot = await tx.timeSlot.create({
            data: {
              name: hour.name,
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
          existingByKey.set(key, slot);
          created = true;
        }
        if (created || isSlotBookable(slot)) {
          await this.enrollRegularsOnSlot(tx, slot);
        }
      }
    }
  }

  private async enrollRegularsOnSlot(
    tx: DbClient,
    slot: {
      id: string;
      studioHourId?: string | null;
      startsAt: Date;
      enrolledCount: number;
      capacity: number;
      status: 'OPEN' | 'FULL' | 'CLOSED';
    },
  ) {
    if (!slot.studioHourId || !isSlotBookable(slot)) {
      return;
    }
    const weekday = weekdayFromCalendarDate(calendarDate(slot.startsAt));
    const regulars = await tx.studentRegularSlot.findMany({
      where: { studioHourId: slot.studioHourId, weekday },
    });
    if (regulars.length === 0) {
      return;
    }
    const students = await tx.user.findMany({
      where: {
        id: { in: regulars.map((item) => item.studentId) },
        role: 'STUDENT',
      },
    });
    const activeIds = new Set(
      students
        .filter((student) => student.isActive !== false)
        .map((student) => student.id),
    );
    const existing = await tx.booking.findMany({
      where: { timeSlotId: slot.id },
    });
    const alreadyTouched = new Set(existing.map((booking) => booking.studentId));

    let current = { ...slot };
    for (const studentId of activeIds) {
      if (alreadyTouched.has(studentId) || !isSlotBookable(current)) {
        continue;
      }
      await tx.booking.create({
        data: {
          studentId,
          timeSlotId: slot.id,
          kind: 'REGULAR',
          status: 'CONFIRMED',
        },
      });
      const next = applySeatChange(current, 1);
      current = { ...current, ...next };
      await tx.timeSlot.update({
        where: { id: slot.id },
        data: next,
      });
    }
  }

  private async propagateStudioHourDetails(
    tx: DbClient,
    hour: {
      id: string;
      name: string;
      capacity: number;
      classType: string;
      trainerId: string;
    },
  ) {
    const now = this.clock.now();
    const slots = await tx.timeSlot.findMany({
      where: { studioHourId: hour.id, startsAt: { gt: now } },
    });
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
          name: hour.name,
          capacity: hour.capacity,
          classType: hour.classType,
          trainerId: hour.trainerId,
          enrolledCount: next.enrolledCount,
          status: slot.status === 'CLOSED' ? 'CLOSED' : next.status,
        },
      });
    }
  }

  private async assertCanMutateEnrolledHour(
    studioHourId: string,
    confirmWithEnrolled?: boolean,
  ) {
    const now = this.clock.now();
    const futureSlots = await this.prisma.timeSlot.findMany({
      where: { studioHourId, startsAt: { gt: now } },
    });
    const futureBookings = await this.prisma.booking.count({
      where: {
        status: 'CONFIRMED',
        timeSlotId: { in: futureSlots.map((slot) => slot.id) },
      },
    });
    const regularStudents = await this.prisma.studentRegularSlot.findMany({
      where: { studioHourId },
    });
    const regularCount = new Set(regularStudents.map((row) => row.studentId))
      .size;
    if (
      (futureBookings > 0 || regularCount > 0) &&
      !confirmWithEnrolled
    ) {
      throw new ConflictException({
        code: 'ENROLLED_STUDENTS',
        message: `Há ${regularCount} aluno(s) matriculado(s) e ${futureBookings} reserva(s) futura(s) nesta turma.`,
        futureBookings,
        regularStudents: regularCount,
      });
    }
  }

  private async clearFutureGeneratedSlots(
    tx: DbClient,
    studioHourId: string,
    options: { requireEmpty: boolean; cancelBookings?: boolean },
  ) {
    const now = this.clock.now();
    const slots = await tx.timeSlot.findMany({
      where: { studioHourId, startsAt: { gt: now } },
    });
    for (const slot of slots) {
      if (options.cancelBookings) {
        await this.cancelConfirmedOnSlot(tx, slot, now);
        const latest = await tx.timeSlot.findUniqueOrThrow({
          where: { id: slot.id },
        });
        await this.removeEmptySlot(tx, latest);
        continue;
      }
      if (options.requireEmpty && slot.enrolledCount > 0) {
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

  private async cancelConfirmedOnSlot(
    tx: DbClient,
    slot: { id: string; enrolledCount: number; capacity: number; status: string },
    now: Date,
  ) {
    const confirmed = await tx.booking.findMany({
      where: { timeSlotId: slot.id, status: 'CONFIRMED' },
    });
    if (confirmed.length === 0) {
      return;
    }
    for (const booking of confirmed) {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' },
      });
      await tx.cancellation.create({
        data: {
          bookingId: booking.id,
          cancelledAt: now,
          cancelledBy: 'TRAINER',
          generatedCredit: false,
          creditId: null,
        },
      });
    }
    const next = applySeatChange(
      {
        enrolledCount: slot.enrolledCount,
        capacity: slot.capacity,
        status: slot.status as 'OPEN' | 'FULL' | 'CLOSED',
      },
      -confirmed.length,
    );
    await tx.timeSlot.update({
      where: { id: slot.id },
      data: next,
    });
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

function parseTimeSlotRange(
  range?: TimeSlotRange,
): { from: string; to: string } | undefined {
  if (!range) {
    return undefined;
  }
  const from = range.from?.trim();
  const to = range.to?.trim();
  if (!from && !to) {
    return undefined;
  }
  if (!from || !to) {
    throw new BadRequestException('Informe from e to juntos');
  }
  const parsedFrom = isoDateSchema.safeParse(from);
  const parsedTo = isoDateSchema.safeParse(to);
  if (!parsedFrom.success || !parsedTo.success) {
    throw new BadRequestException('Informe from e to em YYYY-MM-DD');
  }
  if (parsedTo.data < parsedFrom.data) {
    throw new BadRequestException('O término da janela deve ser após o início');
  }
  return { from: parsedFrom.data, to: parsedTo.data };
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
