import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { creditSourceLabel, creditStatusLabel } from './credit-copy';

describe('credit-copy', () => {
  it('nomeia as três origens aceitas (RN-017 / RN-019)', () => {
    assert.equal(creditSourceLabel('CANCELLATION'), 'Cancelamento');
    assert.equal(
      creditSourceLabel('TRAINER_CANCELLATION'),
      'Cancelamento pelo professor',
    );
    assert.equal(
      creditSourceLabel('CLOSURE_COMPENSATION'),
      'Compensação de fechamento',
    );
  });

  it('nomeia os status incluindo anulado (RN-018)', () => {
    assert.equal(creditStatusLabel('AVAILABLE'), 'Ativo');
    assert.equal(creditStatusLabel('USED'), 'Utilizado');
    assert.equal(creditStatusLabel('EXPIRED'), 'Expirado');
    assert.equal(creditStatusLabel('ANNULLED'), 'Anulado');
  });
});
