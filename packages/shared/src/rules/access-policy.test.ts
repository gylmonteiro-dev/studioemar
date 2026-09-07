import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canActAsRole } from './access-policy.js';

describe('canActAsRole', () => {
  it('faz SUPERADMIN herdar ADMIN e TRAINER', () => {
    assert.equal(canActAsRole('SUPERADMIN', ['SUPERADMIN']), true);
    assert.equal(canActAsRole('SUPERADMIN', ['ADMIN']), true);
    assert.equal(canActAsRole('SUPERADMIN', ['TRAINER']), true);
  });

  it('faz ADMIN herdar TRAINER sem alcançar SUPERADMIN', () => {
    assert.equal(canActAsRole('ADMIN', ['TRAINER']), true);
    assert.equal(canActAsRole('ADMIN', ['SUPERADMIN']), false);
  });

  it('mantém STUDENT isolado dos operadores', () => {
    assert.equal(canActAsRole('SUPERADMIN', ['STUDENT']), false);
    assert.equal(canActAsRole('STUDENT', ['TRAINER']), false);
  });
});
