import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../common/public.decorator';

const SECRET = 'test-access-secret';

function contextWith(authorization?: string): {
  context: ExecutionContext;
  request: { headers: { authorization?: string }; user?: unknown };
} {
  const request: { headers: { authorization?: string }; user?: unknown } = {
    headers: { authorization },
    user: undefined,
  };
  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
  return { context, request };
}

function guard(isPublic = false): JwtAuthGuard {
  const reflector = {
    getAllAndOverride: (key: string) =>
      key === IS_PUBLIC_KEY ? isPublic : undefined,
  } as unknown as Reflector;
  return new JwtAuthGuard(reflector, new JwtService());
}

describe('JwtAuthGuard', () => {
  it('libera rota pública', () => {
    assert.equal(guard(true).canActivate(contextWith().context), true);
  });

  it('recusa ausência de Bearer', () => {
    assert.throws(
      () => guard().canActivate(contextWith().context),
      UnauthorizedException,
    );
    assert.throws(
      () => guard().canActivate(contextWith('Token abc').context),
      UnauthorizedException,
    );
  });

  it('aceita access token e preenche request.user', () => {
    const previous = process.env.JWT_SECRET;
    process.env.JWT_SECRET = SECRET;
    try {
      const jwt = new JwtService();
      const token = jwt.sign(
        {
          sub: 'user-joao',
          email: 'joao@studioemar.local',
          role: 'STUDENT',
          typ: 'access',
        },
        { secret: SECRET },
      );
      const { context, request } = contextWith(`Bearer ${token}`);
      assert.equal(guard().canActivate(context), true);
      const user = request.user as { id: string; role: string } | undefined;
      assert.equal(user?.id, 'user-joao');
      assert.equal(user?.role, 'STUDENT');
    } finally {
      process.env.JWT_SECRET = previous;
    }
  });

  it('recusa refresh token no Authorization', () => {
    const previous = process.env.JWT_SECRET;
    process.env.JWT_SECRET = SECRET;
    try {
      const jwt = new JwtService();
      const token = jwt.sign(
        { sub: 'user-joao', typ: 'refresh' },
        { secret: SECRET },
      );
      assert.throws(
        () => guard().canActivate(contextWith(`Bearer ${token}`).context),
        UnauthorizedException,
      );
    } finally {
      process.env.JWT_SECRET = previous;
    }
  });
});
