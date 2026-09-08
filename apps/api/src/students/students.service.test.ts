import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreditsService } from '../credits/credits.service';
import type { Clock } from '../common/clock';
import { StudentAccessService } from '../common/student-access.service';
import { createMemoryPrisma, fixedClock } from '../test/memory-prisma';
import type { AuthUser } from '../auth/auth.types';

const NOW = '2026-09-03T15:00:00.000Z';
const plan = { id: 'plan-3x', name: '3x', weeklyFrequency: 3 };
const admin: AuthUser = {
  id: 'user-admin',
  email: 'admin@studioemar.local',
  role: 'ADMIN',
};

function createStudents() {
  const { prisma, store } = createMemoryPrisma({
    plans: [plan],
    users: [
      {
        id: 'user-joao',
        name: 'João',
        email: 'joao@studioemar.local',
        role: 'STUDENT',
        planId: 'plan-3x',
        mustSetPassword: false,
        passwordHash: 'hash',
      },
    ],
  });
  const credits = new CreditsService(prisma, fixedClock(NOW) as Clock);
  return {
    students: new StudentsService(
      prisma,
      credits,
      new StudentAccessService(prisma),
    ),
    store,
  };
}

describe('StudentsService', () => {
  it('cria aluno com mustSetPassword e sem senha (RN-021 / RN-022)', async () => {
    const { students, store } = createStudents();
    const user = await students.create(
      {
        name: ' Ana Silva ',
        email: 'Ana@studioemar.local',
        planId: 'plan-3x',
      },
      admin,
    );
    assert.equal(user.email, 'ana@studioemar.local');
    assert.equal(user.name, 'Ana Silva');
    assert.equal(user.mustSetPassword, true);
    assert.equal(user.role, 'STUDENT');
    assert.equal('passwordHash' in user, false);
    assert.equal(store.users.at(-1)?.passwordHash, null);
  });

  it('recusa e-mail já cadastrado', async () => {
    const { students } = createStudents();
    await assert.rejects(
      () =>
        students.create(
          {
            name: 'João 2',
            email: 'joao@studioemar.local',
            planId: 'plan-3x',
          },
          admin,
        ),
      ConflictException,
    );
  });

  it('recusa plano inexistente', async () => {
    const { students } = createStudents();
    await assert.rejects(
      () =>
        students.create(
          {
            name: 'Ana',
            email: 'ana@studioemar.local',
            planId: 'missing',
          },
          admin,
        ),
      NotFoundException,
    );
  });

  it('grava plano em maiúsculas e recusa nome duplicado', async () => {
    const { students, store } = createStudents();
    const created = await students.createPlan({
      name: '  2x  manhã ',
      weeklyFrequency: 2,
      sessionMinutes: 60,
    });
    assert.equal(created.name, '2X MANHÃ');
    assert.equal(created.monthlyClasses, 8);
    assert.equal(created.monthlyHours, 8);
    assert.equal(created.price, null);
    await assert.rejects(
      () =>
        students.createPlan({
          name: '2x manhã',
          weeklyFrequency: 3,
          sessionMinutes: 60,
        }),
      ConflictException,
    );
    assert.equal(store.plans.length, 2);
  });

  it('recusa excluir plano com aluno vinculado', async () => {
    const { students } = createStudents();
    await assert.rejects(() => students.deletePlan('plan-3x'), ConflictException);
  });
});
