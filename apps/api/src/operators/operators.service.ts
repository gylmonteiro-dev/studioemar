import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateOperatorRequest,
  UpdateOperatorRequest,
} from '@studioemar/shared';
import type { AuthUser } from '../auth/auth.types';
import { toUser } from '../common/mappers';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(actor: AuthUser) {
    const roles =
      actor.role === 'SUPERADMIN'
        ? (['ADMIN', 'TRAINER'] as const)
        : (['TRAINER'] as const);
    const users = await this.prisma.user.findMany({
      where: { role: { in: [...roles] } },
      orderBy: { name: 'asc' },
    });
    return users.map((user) => toUser(user));
  }

  async create(input: CreateOperatorRequest, actor: AuthUser) {
    this.assertCanManageRole(actor, input.role);
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Já existe uma conta com este e-mail');
    }

    const user = await this.prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        role: input.role,
        mustSetPassword: true,
        passwordHash: null,
      },
    });
    return toUser(user);
  }

  async update(
    operatorId: string,
    input: UpdateOperatorRequest,
    actor: AuthUser,
  ) {
    if (operatorId === actor.id) {
      throw new ForbiddenException('Não altere sua própria conta por esta tela');
    }
    const target = await this.prisma.user.findUnique({
      where: { id: operatorId },
    });
    if (!target || (target.role !== 'TRAINER' && target.role !== 'ADMIN')) {
      throw new NotFoundException('Operador não encontrado');
    }
    this.assertCanManageRole(actor, target.role);
    if (input.role) {
      this.assertCanManageRole(actor, input.role);
    }

    const email = input.email?.trim().toLowerCase();
    if (email && email !== target.email) {
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new ConflictException('Já existe uma conta com este e-mail');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: operatorId },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(email ? { email } : {}),
        ...(input.role ? { role: input.role } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
    return toUser(user);
  }

  private assertCanManageRole(
    actor: AuthUser,
    targetRole: 'TRAINER' | 'ADMIN',
  ): void {
    if (actor.role === 'SUPERADMIN') {
      return;
    }
    if (actor.role === 'ADMIN' && targetRole === 'TRAINER') {
      return;
    }
    throw new ForbiddenException('Sem permissão para gerenciar este papel');
  }
}
