import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { homePathForRole, isTrainerRole } from './auth-routing';

describe('auth-routing', () => {
  it('manda aluno para /aluno e operadores para /treinador', () => {
    assert.equal(homePathForRole('STUDENT'), '/aluno');
    assert.equal(homePathForRole('TRAINER'), '/treinador');
    assert.equal(homePathForRole('ADMIN'), '/treinador');
    assert.equal(homePathForRole('SUPERADMIN'), '/treinador');
  });

  it('trata toda a hierarquia de operadores como treinador', () => {
    assert.equal(isTrainerRole('ADMIN'), true);
    assert.equal(isTrainerRole('SUPERADMIN'), true);
    assert.equal(isTrainerRole('TRAINER'), true);
    assert.equal(isTrainerRole('STUDENT'), false);
  });
});
