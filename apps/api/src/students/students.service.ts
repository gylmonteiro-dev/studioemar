import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  canActAsRole,
  clockIntervalMinutes,
  normalizePlanName,
  regularAvailabilitySlotSchema,
  type CreatePlanRequest,
  type CreateStudentRequest,
  type RegularAvailabilitySlot,
  type RegularSlotSelection,
  type UpdatePlanRequest,
  type UpdateStudentRequest,
  type UpdateStudentTrainersRequest,
  type Weekday,
} from '@studioemar/shared';
import type { StudioHour, TimeSlot, UserRole } from '@prisma/client';
import type { AuthUser } from '../auth/auth.types';
import {
  calendarDate,
  weekdayFromCalendarDate,
} from '../common/calendar-date';
import { Clock } from '../common/clock';
import { toBooking, toCredit, toPlan, toRegularSlotsFromRows, toUser } from '../common/mappers';
import { StudentAccessService } from '../common/student-access.service';
import { remainingSpotsForRegularPair } from '../domain/regular-availability';
import { applySeatChange, isSlotBookable } from '../domain/slot-occupancy';
import { WEEKDAY_ORDER } from '../domain/studio-hours';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { SchedulesService } from '../schedules/schedules.service';

const STUDENT_INCLUDE = {
  studentTrainerLinks: { select: { trainerId: true } },
  studentRegularSlots: { include: { studioHour: true } },
} as const;

type StudentRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  planId: string | null;
  cpf: string | null;
  mustSetPassword: boolean;
  isActive: boolean;
  studentTrainerLinks: Array<{ trainerId: string }>;
  studentRegularSlots: Array<{
    studioHourId: string;
    weekday: Weekday;
    studioHour: StudioHour;
  }>;
};

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credits: CreditsService,
    private readonly access: StudentAccessService,
    private readonly clock: Clock,
    private readonly schedules: SchedulesService,
  ) {}

  async list(actor: AuthUser) {
    const users = await this.prisma.user.findMany({
      where: this.access.whereFor(actor),
      include: STUDENT_INCLUDE,
      orderBy: { name: 'asc' },
    });
    return users.map((user) => this.toStudent(user as StudentRow));
  }

  async getById(studentId: string, actor: AuthUser) {
    await this.access.assertCanAccess(actor, studentId);
    const user = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: STUDENT_INCLUDE,
    });
    if (!user || user.role !== 'STUDENT') {
      throw new NotFoundException('Aluno não encontrado');
    }
    return this.toStudent(user as StudentRow);
  }

  async listRegularAvailability(planId: string) {
    if (!planId) {
      throw new BadRequestException('Informe o plano');
    }
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    const now = this.clock.now();
    await this.schedules.ensureLookAhead();
    const [hours, timeSlots] = await Promise.all([
      this.prisma.studioHour.findMany({
        orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.timeSlot.findMany({
        where: { startsAt: { gt: now } },
      }),
    ]);

    const available: RegularAvailabilitySlot[] = [];
    for (const hour of hours) {
      if (
        clockIntervalMinutes(hour.startTime, hour.endTime) !==
        plan.sessionMinutes
      ) {
        continue;
      }
      for (const weekday of sortWeekdays(hour.weekdays as Weekday[])) {
        const remaining = remainingSpotsForRegularPair(
          this.slotsForPair(timeSlots, hour.id, weekday),
        );
        if (remaining === null) {
          continue;
        }
        available.push(
          regularAvailabilitySlotSchema.parse({
            studioHourId: hour.id,
            name: hour.name,
            weekday,
            startTime: hour.startTime,
            endTime: hour.endTime,
            classType: hour.classType,
            trainerId: hour.trainerId,
            capacity: hour.capacity,
            remainingSpots: remaining,
          }),
        );
      }
    }
    return available;
  }

  async create(input: CreateStudentRequest, actor: AuthUser) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Já existe uma conta com este e-mail');
    }
    const cpfTaken = await this.prisma.user.findUnique({
      where: { cpf: input.cpf },
    });
    if (cpfTaken) {
      throw new ConflictException('Já existe uma conta com este CPF');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: input.planId },
    });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }
    if (input.regularSlots.length !== plan.weeklyFrequency) {
      throw new BadRequestException(
        `Escolha ${plan.weeklyFrequency} ${plan.weeklyFrequency === 1 ? 'dia' : 'dias'} conforme o plano`,
      );
    }

    const trainerIds =
      actor.role === 'TRAINER' ? [actor.id] : [...new Set(input.trainerIds)];
    if (trainerIds.length === 0) {
      throw new BadRequestException('Informe pelo menos um professor');
    }
    await this.validateTrainerIds(trainerIds);

    await this.schedules.ensureLookAhead();
    const now = this.clock.now();
    const toBook = await this.resolveRegularBookings(
      input.regularSlots,
      plan.sessionMinutes,
      now,
    );

    const createdId = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: input.name.trim(),
          email,
          cpf: input.cpf,
          role: 'STUDENT',
          planId: plan.id,
          mustSetPassword: true,
          passwordHash: null,
        },
      });
      await tx.studentTrainer.createMany({
        data: trainerIds.map((trainerId) => ({
          studentId: created.id,
          trainerId,
        })),
      });
      for (const slot of input.regularSlots) {
        await tx.studentRegularSlot.create({
          data: {
            studentId: created.id,
            studioHourId: slot.studioHourId,
            weekday: slot.weekday,
          },
        });
      }
      for (const slot of toBook) {
        await tx.booking.create({
          data: {
            studentId: created.id,
            timeSlotId: slot.id,
            kind: 'REGULAR',
            status: 'CONFIRMED',
          },
        });
        const next = applySeatChange(slot, 1);
        await tx.timeSlot.update({
          where: { id: slot.id },
          data: next,
        });
      }
      return created.id;
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: createdId },
      include: STUDENT_INCLUDE,
    });
    return this.toStudent(user as StudentRow);
  }

  async listPlans() {
    const plans = await this.prisma.plan.findMany({
      orderBy: { name: 'asc' },
    });
    return plans.map(toPlan);
  }

  async createPlan(input: CreatePlanRequest) {
    const name = normalizePlanName(input.name);
    const existing = await this.prisma.plan.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictException('Já existe um plano com este nome');
    }
    const created = await this.prisma.plan.create({
      data: {
        name,
        weeklyFrequency: input.weeklyFrequency,
        sessionMinutes: input.sessionMinutes,
        price: input.price ?? null,
      },
    });
    return toPlan(created);
  }

  async updatePlan(id: string, input: UpdatePlanRequest) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }
    const name = input.name ? normalizePlanName(input.name) : plan.name;
    if (name !== plan.name) {
      const clash = await this.prisma.plan.findUnique({ where: { name } });
      if (clash) {
        throw new ConflictException('Já existe um plano com este nome');
      }
    }
    const updated = await this.prisma.plan.update({
      where: { id },
      data: {
        name,
        weeklyFrequency: input.weeklyFrequency ?? plan.weeklyFrequency,
        sessionMinutes: input.sessionMinutes ?? plan.sessionMinutes,
        ...(input.price !== undefined ? { price: input.price } : {}),
      },
    });
    return toPlan(updated);
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }
    const enrolled = await this.prisma.user.count({
      where: { planId: id },
    });
    if (enrolled > 0) {
      throw new ConflictException(
        'Não é possível excluir um plano com alunos vinculados',
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.recurringSlot.deleteMany({ where: { planId: id } });
      await tx.plan.delete({ where: { id } });
    });
  }

  async listBookings(studentId: string, actor: AuthUser) {
    await this.access.assertCanAccess(actor, studentId);
    const bookings = await this.prisma.booking.findMany({
      where: { studentId },
      include: { timeSlot: true },
      orderBy: { timeSlot: { startsAt: 'asc' } },
    });
    return bookings.map((row) => toBooking(row));
  }

  async listCredits(studentId: string, actor: AuthUser) {
    await this.access.assertCanAccess(actor, studentId);
    await this.credits.expireStale(studentId);
    const credits = await this.prisma.credit.findMany({
      where: { studentId },
      orderBy: { generatedAt: 'desc' },
    });
    return credits.map(toCredit);
  }

  async updateTrainers(
    studentId: string,
    input: UpdateStudentTrainersRequest,
    actor: AuthUser,
  ) {
    await this.access.assertCanAccess(actor, studentId);
    const trainerIds = [...new Set(input.trainerIds)];
    await this.validateTrainerIds(trainerIds);

    await this.prisma.$transaction(async (tx) => {
      await tx.studentTrainer.deleteMany({ where: { studentId } });
      if (trainerIds.length > 0) {
        await tx.studentTrainer.createMany({
          data: trainerIds.map((trainerId) => ({ studentId, trainerId })),
        });
      }
    });
    return this.getById(studentId, actor);
  }

  async updateStudent(
    studentId: string,
    input: UpdateStudentRequest,
    actor: AuthUser,
  ) {
    await this.access.assertCanAccess(actor, studentId);
    const user = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { studentRegularSlots: true },
    });
    if (!user || user.role !== 'STUDENT') {
      throw new NotFoundException('Aluno não encontrado');
    }

    const scheduleChange = input.planId !== undefined || input.regularSlots;
    if (scheduleChange && !canActAsRole(actor.role, ['ADMIN'])) {
      throw new ForbiddenException('Sem permissão para alterar plano ou horários');
    }

    const nextActive = input.isActive ?? user.isActive;
    if (user.isActive && nextActive === false) {
      await this.cancelFutureBookings(studentId);
    }

    if (scheduleChange && nextActive !== false) {
      await this.reorganizeRegularSchedule(studentId, user, input);
    } else {
      await this.prisma.user.update({
        where: { id: studentId },
        data: {
          isActive: nextActive,
          ...(input.planId ? { planId: input.planId } : {}),
        },
      });
    }

    if (!user.isActive && nextActive === true) {
      await this.schedules.ensureLookAhead();
    }

    return this.getById(studentId, actor);
  }

  async remove(studentId: string, actor: AuthUser) {
    if (!canActAsRole(actor.role, ['ADMIN'])) {
      throw new ForbiddenException('Sem permissão para excluir aluno');
    }
    await this.access.assertCanAccess(actor, studentId);
    const user = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!user || user.role !== 'STUDENT') {
      throw new NotFoundException('Aluno não encontrado');
    }

    const bookings = await this.prisma.booking.findMany({
      where: { studentId },
      include: { timeSlot: true },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const row of bookings) {
        if (row.status !== 'CONFIRMED' || !row.timeSlot) {
          continue;
        }
        const latest = await tx.timeSlot.findUniqueOrThrow({
          where: { id: row.timeSlot.id },
        });
        const next = applySeatChange(latest, -1);
        await tx.timeSlot.update({
          where: { id: latest.id },
          data: next,
        });
      }

      const bookingIds = bookings.map((row) => row.id);
      await tx.credit.deleteMany({ where: { studentId } });
      if (bookingIds.length > 0) {
        await tx.cancellation.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
      }
      await tx.booking.deleteMany({ where: { studentId } });
      await tx.waitlistEntry.deleteMany({ where: { studentId } });
      await tx.studentTrainer.deleteMany({ where: { studentId } });
      await tx.studentRegularSlot.deleteMany({ where: { studentId } });
      await tx.user.delete({ where: { id: studentId } });
    });
  }

  private async cancelFutureBookings(studentId: string) {
    const now = this.clock.now();
    const bookings = await this.prisma.booking.findMany({
      where: { studentId, status: 'CONFIRMED' },
      include: { timeSlot: true },
    });
    const future = bookings.filter(
      (row) => row.timeSlot && row.timeSlot.startsAt > now,
    );

    await this.prisma.$transaction(async (tx) => {
      for (const row of future) {
        const slot = row.timeSlot;
        if (!slot) {
          continue;
        }
        await tx.booking.update({
          where: { id: row.id },
          data: { status: 'CANCELLED' },
        });
        await tx.cancellation.create({
          data: {
            bookingId: row.id,
            cancelledAt: now,
            cancelledBy: 'TRAINER',
            generatedCredit: false,
            creditId: null,
          },
        });
        const latest = await tx.timeSlot.findUniqueOrThrow({
          where: { id: slot.id },
        });
        const next = applySeatChange(latest, -1);
        await tx.timeSlot.update({
          where: { id: slot.id },
          data: next,
        });
      }
    });
  }

  private async reorganizeRegularSchedule(
    studentId: string,
    user: {
      planId: string | null;
      isActive: boolean;
      studentRegularSlots: Array<{ studioHourId: string; weekday: Weekday }>;
    },
    input: UpdateStudentRequest,
  ) {
    const planId = input.planId ?? user.planId;
    if (!planId) {
      throw new BadRequestException('Informe o plano');
    }
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    const selections = input.regularSlots ?? user.studentRegularSlots;
    if (selections.length !== plan.weeklyFrequency) {
      throw new BadRequestException(
        `Escolha ${plan.weeklyFrequency} ${plan.weeklyFrequency === 1 ? 'dia' : 'dias'} conforme o plano`,
      );
    }

    await this.schedules.ensureLookAhead();
    const now = this.clock.now();
    const toBook = await this.resolveRegularBookings(
      selections,
      plan.sessionMinutes,
      now,
      studentId,
    );

    const keep = new Set(
      selections.map((slot) => `${slot.studioHourId}:${slot.weekday}`),
    );
    const current = await this.prisma.booking.findMany({
      where: { studentId, status: 'CONFIRMED', kind: 'REGULAR' },
      include: { timeSlot: true },
    });
    const toCancel = current.filter((row) => {
      const slot = row.timeSlot;
      if (!slot || slot.startsAt <= now) {
        return false;
      }
      const weekday = weekdayFromCalendarDate(calendarDate(slot.startsAt));
      return !keep.has(`${slot.studioHourId}:${weekday}`);
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: studentId },
        data: {
          planId: plan.id,
          isActive: input.isActive ?? user.isActive,
        },
      });
      await tx.studentRegularSlot.deleteMany({ where: { studentId } });
      for (const slot of selections) {
        await tx.studentRegularSlot.create({
          data: {
            studentId,
            studioHourId: slot.studioHourId,
            weekday: slot.weekday,
          },
        });
      }
      for (const row of toCancel) {
        const slot = row.timeSlot;
        if (!slot) {
          continue;
        }
        await tx.booking.update({
          where: { id: row.id },
          data: { status: 'CANCELLED' },
        });
        await tx.cancellation.create({
          data: {
            bookingId: row.id,
            cancelledAt: now,
            cancelledBy: 'TRAINER',
            generatedCredit: false,
            creditId: null,
          },
        });
        const latest = await tx.timeSlot.findUniqueOrThrow({
          where: { id: slot.id },
        });
        await tx.timeSlot.update({
          where: { id: slot.id },
          data: applySeatChange(latest, -1),
        });
      }
      if (input.isActive === false || user.isActive === false) {
        return;
      }
      const confirmed = await tx.booking.findMany({
        where: { studentId, status: 'CONFIRMED' },
      });
      const alreadyIn = new Set(confirmed.map((row) => row.timeSlotId));
      for (const slot of toBook) {
        if (alreadyIn.has(slot.id) || !isSlotBookable(slot)) {
          continue;
        }
        const latest = await tx.timeSlot.findUniqueOrThrow({
          where: { id: slot.id },
        });
        if (!isSlotBookable(latest)) {
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
        await tx.timeSlot.update({
          where: { id: slot.id },
          data: applySeatChange(latest, 1),
        });
      }
    });
  }

  private toStudent(user: StudentRow) {
    return toUser(
      user,
      user.studentTrainerLinks.map((link) => link.trainerId),
      toRegularSlotsFromRows(user.studentRegularSlots),
    );
  }

  private async resolveRegularBookings(
    selections: RegularSlotSelection[],
    sessionMinutes: number,
    now: Date,
    excludeStudentId?: string,
  ) {
    const hourIds = [...new Set(selections.map((slot) => slot.studioHourId))];
    const hours = await this.prisma.studioHour.findMany({
      where: { id: { in: hourIds } },
    });
    if (hours.length !== hourIds.length) {
      throw new BadRequestException('Há horário do estúdio inválido');
    }
    const hourById = new Map(hours.map((hour) => [hour.id, hour]));
    const timeSlots = await this.prisma.timeSlot.findMany({
      where: {
        studioHourId: { in: hourIds },
        startsAt: { gt: now },
      },
    });

    const toBook: TimeSlot[] = [];
    for (const selection of selections) {
      const hour = hourById.get(selection.studioHourId);
      if (!hour) {
        throw new BadRequestException('Há horário do estúdio inválido');
      }
      if (!(hour.weekdays as Weekday[]).includes(selection.weekday)) {
        throw new BadRequestException(
          'O dia escolhido não faz parte deste horário',
        );
      }
      if (
        clockIntervalMinutes(hour.startTime, hour.endTime) !== sessionMinutes
      ) {
        throw new BadRequestException(
          'A duração do horário não corresponde ao plano',
        );
      }
      const pairSlots = this.slotsForPair(
        timeSlots,
        selection.studioHourId,
        selection.weekday,
      );
      const ownIds = excludeStudentId
        ? new Set(
            (
              await this.prisma.booking.findMany({
                where: {
                  studentId: excludeStudentId,
                  status: 'CONFIRMED',
                  timeSlotId: { in: pairSlots.map((slot) => slot.id) },
                },
              })
            ).map((row) => row.timeSlotId),
          )
        : new Set<string>();
      const adjusted = pairSlots.map((slot) =>
        ownIds.has(slot.id)
          ? {
              ...slot,
              enrolledCount: Math.max(0, slot.enrolledCount - 1),
              status: 'OPEN' as const,
            }
          : slot,
      );
      if (remainingSpotsForRegularPair(adjusted) === null) {
        throw new ConflictException(
          'Há horário sem vaga disponível. Atualize a seleção.',
        );
      }
      toBook.push(...pairSlots.filter((slot) => isSlotBookable(slot)));
    }
    return toBook;
  }

  private slotsForPair(
    timeSlots: TimeSlot[],
    studioHourId: string,
    weekday: Weekday,
  ) {
    return timeSlots.filter(
      (slot) =>
        slot.studioHourId === studioHourId &&
        weekdayFromCalendarDate(calendarDate(slot.startsAt)) === weekday,
    );
  }

  private async validateTrainerIds(trainerIds: string[]): Promise<void> {
    if (trainerIds.length === 0) {
      return;
    }
    const trainers = await this.prisma.user.findMany({
      where: {
        id: { in: trainerIds },
        role: { in: ['TRAINER', 'ADMIN', 'SUPERADMIN'] },
        isActive: true,
      },
      select: { id: true },
    });
    if (trainers.length !== trainerIds.length) {
      throw new BadRequestException('Há treinador inválido ou inativo');
    }
  }
}

function sortWeekdays(days: readonly Weekday[]): Weekday[] {
  const selected = new Set(days);
  return WEEKDAY_ORDER.filter((day) => selected.has(day));
}
