import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateStudentRequest,
  UpdateStudentTrainersRequest,
} from '@studioemar/shared';
import type { AuthUser } from '../auth/auth.types';
import { toBooking, toCredit, toPlan, toUser } from '../common/mappers';
import { StudentAccessService } from '../common/student-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credits: CreditsService,
    private readonly access: StudentAccessService,
  ) {}

  async list(actor: AuthUser) {
    const users = await this.prisma.user.findMany({
      where: this.access.whereFor(actor),
      include: { studentTrainerLinks: { select: { trainerId: true } } },
      orderBy: { name: 'asc' },
    });
    return users.map((user) =>
      toUser(
        user,
        user.studentTrainerLinks.map((link) => link.trainerId),
      ),
    );
  }

  async getById(studentId: string, actor: AuthUser) {
    await this.access.assertCanAccess(actor, studentId);
    const user = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { studentTrainerLinks: { select: { trainerId: true } } },
    });
    if (!user || user.role !== 'STUDENT') {
      throw new NotFoundException('Aluno não encontrado');
    }
    return toUser(
      user,
      user.studentTrainerLinks.map((link) => link.trainerId),
    );
  }

  async create(input: CreateStudentRequest, actor: AuthUser) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Já existe uma conta com este e-mail');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: input.planId },
    });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    const trainerIds =
      actor.role === 'TRAINER'
        ? [actor.id]
        : [...new Set(input.trainerIds)];
    await this.validateTrainerIds(trainerIds);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: input.name.trim(),
          email,
          role: 'STUDENT',
          planId: plan.id,
          mustSetPassword: true,
          passwordHash: null,
          studentTrainerLinks: {
            create: trainerIds.map((trainerId) => ({ trainerId })),
          },
        },
      });
      return created;
    });
    return toUser(user, trainerIds);
  }

  async listPlans() {
    const plans = await this.prisma.plan.findMany({
      orderBy: { name: 'asc' },
    });
    return plans.map(toPlan);
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

    const user = await this.prisma.$transaction(async (tx) => {
      await tx.studentTrainer.deleteMany({ where: { studentId } });
      if (trainerIds.length > 0) {
        await tx.studentTrainer.createMany({
          data: trainerIds.map((trainerId) => ({ studentId, trainerId })),
        });
      }
      return tx.user.findUniqueOrThrow({ where: { id: studentId } });
    });
    return toUser(user, trainerIds);
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
