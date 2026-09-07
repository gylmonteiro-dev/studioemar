import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentAccessService {
  constructor(private readonly prisma: PrismaService) {}

  whereFor(actor: AuthUser): Prisma.UserWhereInput {
    if (actor.role === 'ADMIN' || actor.role === 'SUPERADMIN') {
      return { role: 'STUDENT' };
    }

    return {
      role: 'STUDENT',
      OR: [
        { studentTrainerLinks: { some: { trainerId: actor.id } } },
        {
          bookings: {
            some: { timeSlot: { trainerId: actor.id } },
          },
        },
      ],
    };
  }

  async assertCanAccess(actor: AuthUser, studentId: string): Promise<void> {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: { role: true },
    });
    if (!student || student.role !== 'STUDENT') {
      throw new NotFoundException('Aluno não encontrado');
    }

    const accessible = await this.prisma.user.findFirst({
      where: { id: studentId, ...this.whereFor(actor) },
      select: { id: true },
    });
    if (!accessible) {
      throw new ForbiddenException('Sem permissão para acessar este aluno');
    }
  }
}
