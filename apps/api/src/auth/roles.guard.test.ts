import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { UserRole } from '@studioemar/shared';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../common/roles.decorator';
import type { AuthUser } from './auth.types';

function contextWith(user?: AuthUser): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

function guardFor(roles: UserRole[] | undefined): RolesGuard {
  const reflector = {
    getAllAndOverride: (key: string) => (key === ROLES_KEY ? roles : undefined),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

const student: AuthUser = {
  id: 'user-joao',
  email: 'joao@studioemar.local',
  role: 'STUDENT',
};
const trainer: AuthUser = {
  id: 'user-carlos',
  email: 'carlos@studioemar.local',
  role: 'TRAINER',
};
const admin: AuthUser = {
  id: 'user-admin',
  email: 'admin@studioemar.local',
  role: 'ADMIN',
};

describe('RolesGuard', () => {
  it('libera rota sem @Roles', () => {
    const guard = guardFor(undefined);
    assert.equal(guard.canActivate(contextWith(student)), true);
  });

  it('bloqueia aluno em rota de treinador', () => {
    const guard = guardFor(['TRAINER']);
    assert.throws(
      () => guard.canActivate(contextWith(student)),
      ForbiddenException,
    );
  });

  it('libera treinador e ADMIN na rota TRAINER (ADR-009)', () => {
    const guard = guardFor(['TRAINER']);
    assert.equal(guard.canActivate(contextWith(trainer)), true);
    assert.equal(guard.canActivate(contextWith(admin)), true);
  });

  it('bloqueia treinador em rota só de aluno', () => {
    const guard = guardFor(['STUDENT']);
    assert.throws(
      () => guard.canActivate(contextWith(trainer)),
      ForbiddenException,
    );
  });

  it('bloqueia ausência de usuário', () => {
    const guard = guardFor(['STUDENT']);
    assert.throws(() => guard.canActivate(contextWith()), ForbiddenException);
  });
});
