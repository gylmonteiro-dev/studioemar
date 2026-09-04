import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { spotsLeft } from './format';

describe('spotsLeft', () => {
  it('não mostra vagas negativas', () => {
    assert.equal(spotsLeft(4, 6), 2);
    assert.equal(spotsLeft(6, 6), 0);
    assert.equal(spotsLeft(7, 6), 0);
  });
});
