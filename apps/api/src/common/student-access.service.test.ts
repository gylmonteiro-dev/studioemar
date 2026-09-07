import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { StudentAccessService } from './student-access.service';

describe('StudentAccessService', () => {
  it('combina vínculo explícito e aula ministrada para TRAINER', () => {
    const service = new StudentAccessService({} as PrismaService);
    assert.deepEqual(
      service.whereFor({
        id: 'trainer-1',
        email: 'trainer@studio.local',
        role: 'TRAINER',
      }),
      {
        role: 'STUDENT',
        OR: [
          {
            studentTrainerLinks: { some: { trainerId: 'trainer-1' } },
          },
          {
            bookings: {
              some: { timeSlot: { trainerId: 'trainer-1' } },
            },
          },
        ],
      },
    );
  });

  it('mantém visão global para ADMIN e SUPERADMIN', () => {
    const service = new StudentAccessService({} as PrismaService);
    for (const role of ['ADMIN', 'SUPERADMIN'] as const) {
      assert.deepEqual(
        service.whereFor({
          id: role,
          email: `${role}@studio.local`,
          role,
        }),
        { role: 'STUDENT' },
      );
    }
  });

  it('nega acesso por id fora do escopo do treinador', async () => {
    const prisma = {
      user: {
        findUnique: async () => ({ role: 'STUDENT' }),
        findFirst: async () => null,
      },
    } as unknown as PrismaService;
    const service = new StudentAccessService(prisma);

    await assert.rejects(
      () =>
        service.assertCanAccess(
          {
            id: 'trainer-1',
            email: 'trainer@studio.local',
            role: 'TRAINER',
          },
          'student-2',
        ),
      ForbiddenException,
    );
  });
});
