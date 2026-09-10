import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { firstAccessSchema, loginSchema, recoverSchema } from './auth-schemas';

describe('auth-schemas', () => {
  it('login aceita e-mail ou CPF', () => {
    assert.equal(
      loginSchema.safeParse({ identifier: 'joao', password: 'x' }).success,
      false,
    );
    assert.equal(
      loginSchema.safeParse({
        identifier: 'joao@studioemar.local',
        password: 'studioemar',
      }).success,
      true,
    );
    assert.equal(
      loginSchema.safeParse({
        identifier: '529.982.247-25',
        password: 'studioemar',
      }).success,
      true,
    );
  });

  it('primeiro acesso exige senhas iguais com 6 caracteres', () => {
    assert.equal(
      firstAccessSchema.safeParse({
        email: 'ana@studioemar.local',
        password: '123456',
        confirmPassword: '654321',
      }).success,
      false,
    );
    assert.equal(
      firstAccessSchema.safeParse({
        email: 'ana@studioemar.local',
        password: '123456',
        confirmPassword: '123456',
      }).success,
      true,
    );
  });

  it('recuperar senha valida o e-mail', () => {
    assert.equal(recoverSchema.safeParse({ email: 'ana' }).success, false);
    assert.equal(
      recoverSchema.safeParse({ email: 'ana@studioemar.local' }).success,
      true,
    );
  });
});
