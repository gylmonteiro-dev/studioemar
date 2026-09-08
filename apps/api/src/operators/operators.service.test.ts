import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { OperatorsService } from './operators.service';

const owner = {
  id: 'owner-1',
  email: 'owner@studio.local',
  role: 'ADMIN' as const,
};
const superadmin = {
  id: 'super-1',
  email: 'admin@studio.local',
  role: 'SUPERADMIN' as const,
};

describe('OperatorsService', () => {
  it('impede ADMIN de alterar outra conta ADMIN', async () => {
    const prisma = {
      user: {
        findUnique: async () => ({
          id: 'owner-2',
          name: 'Outro proprietário',
          email: 'outro@studio.local',
          role: 'ADMIN',
          planId: null,
          mustSetPassword: false,
          isActive: true,
        }),
      },
    } as unknown as PrismaService;

    await assert.rejects(
      () =>
        new OperatorsService(prisma).update(
          'owner-2',
          { isActive: false },
          owner,
        ),
      ForbiddenException,
    );
  });

  it('permite SUPERADMIN alterar papel de ADMIN e TRAINER', async () => {
    const target = {
      id: 'owner-2',
      name: 'Proprietário',
      email: 'owner2@studio.local',
      role: 'ADMIN' as const,
      planId: null,
      mustSetPassword: false,
      isActive: true,
    };
    const prisma = {
      user: {
        findUnique: async () => target,
        update: async ({ data }: { data: Record<string, unknown> }) => ({
          ...target,
          ...data,
        }),
      },
    } as unknown as PrismaService;

    const updated = await new OperatorsService(prisma).update(
      target.id,
      { role: 'TRAINER' },
      superadmin,
    );
    assert.equal(updated.role, 'TRAINER');
  });

  it('lista gestão do SUPERADMIN sem a própria conta', async () => {
    let where: unknown;
    const prisma = {
      user: {
        findMany: async (args: { where: unknown }) => {
          where = args.where;
          return [
            {
              id: 'owner-1',
              name: 'Dono',
              email: 'dono@studio.local',
              role: 'ADMIN',
              planId: null,
              mustSetPassword: false,
              isActive: true,
            },
          ];
        },
      },
    } as unknown as PrismaService;

    const listed = await new OperatorsService(prisma).list(superadmin);
    assert.deepEqual(where, { role: { in: ['ADMIN', 'TRAINER'] } });
    assert.equal(
      listed.some((operator) => operator.role === 'SUPERADMIN'),
      false,
    );
  });

  it('lista teaching com SUPERADMIN e ADMIN ativos', async () => {
    let where: unknown;
    const prisma = {
      user: {
        findMany: async (args: { where: unknown }) => {
          where = args.where;
          return [
            {
              id: 'super-1',
              name: 'Administrador',
              email: 'admin@studio.local',
              role: 'SUPERADMIN',
              planId: null,
              mustSetPassword: false,
              isActive: true,
            },
            {
              id: 'owner-1',
              name: 'Dono',
              email: 'dono@studio.local',
              role: 'ADMIN',
              planId: null,
              mustSetPassword: false,
              isActive: true,
            },
            {
              id: 'trainer-1',
              name: 'Carlos',
              email: 'carlos@studio.local',
              role: 'TRAINER',
              planId: null,
              mustSetPassword: false,
              isActive: true,
            },
          ];
        },
      },
    } as unknown as PrismaService;

    const listed = await new OperatorsService(prisma).list(owner, 'teaching');
    assert.deepEqual(where, {
      role: { in: ['TRAINER', 'ADMIN', 'SUPERADMIN'] },
      isActive: true,
    });
    assert.deepEqual(
      listed.map((operator) => operator.role),
      ['SUPERADMIN', 'ADMIN', 'TRAINER'],
    );
  });
});
