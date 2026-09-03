import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { creditExpiresAt, isCancellationEligibleForCredit } from './credit-policy.js';

describe('isCancellationEligibleForCredit', () => {
  it('concede crédito com 12 horas ou mais de antecedência', () => {
    const startsAt = new Date('2026-09-03T21:00:00.000Z');
    const now = new Date('2026-09-03T09:00:00.000Z');
    assert.equal(isCancellationEligibleForCredit(now, startsAt), true);
  });

  it('nega crédito com menos de 12 horas', () => {
    const startsAt = new Date('2026-09-03T21:00:00.000Z');
    const now = new Date('2026-09-03T10:00:00.000Z');
    assert.equal(isCancellationEligibleForCredit(now, startsAt), false);
  });
});

describe('creditExpiresAt', () => {
  it('soma 30 dias em UTC', () => {
    const generatedAt = new Date('2026-09-03T21:00:00.000Z');
    assert.equal(
      creditExpiresAt(generatedAt).toISOString(),
      '2026-10-03T21:00:00.000Z',
    );
  });
});
