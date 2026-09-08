import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeClassTypeName } from './class-types.js';

describe('normalizeClassTypeName', () => {
  it('grava o tipo em maiúsculas e compacta espaços', () => {
    assert.equal(normalizeClassTypeName('  funcional  matinal '), 'FUNCIONAL MATINAL');
  });
});
