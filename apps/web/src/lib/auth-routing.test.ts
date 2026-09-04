import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { homePathForRole, isTrainerRole } from './auth-routing';

describe('auth-routing', () => {
  it('manda aluno para /aluno e treinador/admin para /treinador', () => {
    assert.equal(homePathForRole('STUDENT'), '/aluno');
    assert.equal(homePathForRole('TRAINER'), '/treinador');
    assert.equal(homePathForRole('ADMIN'), '/treinador');
  });

  it('trata ADMIN como treinador no início (ADR-009)', () => {
    assert.equal(isTrainerRole('ADMIN'), true);
    assert.equal(isTrainerRole('TRAINER'), true);
    assert.equal(isTrainerRole('STUDENT'), false);
  });
});
