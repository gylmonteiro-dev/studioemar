import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateStudentRequest } from '@studioemar/shared';
import { toBooking, toCredit, toPlan, toUser } from '../common/mappers';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credits: CreditsService,
  ) {}

  async list() {
    const users = await this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { name: 'asc' },
    });
    return users.map(toUser);
  }

  async getById(studentId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!user || user.role !== 'STUDENT') {
      throw new NotFoundException('Aluno não encontrado');
    }
    return toUser(user);
  }

  async create(input: CreateStudentRequest) {
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

    const user = await this.prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        role: 'STUDENT',
        planId: plan.id,
        mustSetPassword: true,
        passwordHash: null,
      },
    });
    return toUser(user);
  }

  async listPlans() {
    const plans = await this.prisma.plan.findMany({
      orderBy: { name: 'asc' },
    });
    return plans.map(toPlan);
  }

  async listBookings(studentId: string) {
    await this.getById(studentId);
    const bookings = await this.prisma.booking.findMany({
      where: { studentId },
      include: { timeSlot: true },
      orderBy: { timeSlot: { startsAt: 'asc' } },
    });
    return bookings.map((row) => toBooking(row));
  }

  async listCredits(studentId: string) {
    await this.getById(studentId);
    await this.credits.expireStale(studentId);
    const credits = await this.prisma.credit.findMany({
      where: { studentId },
      orderBy: { generatedAt: 'desc' },
    });
    return credits.map(toCredit);
  }
}
