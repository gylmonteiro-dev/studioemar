import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  creditExpiresAt,
  isCancellationEligibleForCredit,
  isOwnRegularTrainingSlot,
} from './credit-policy.js';

describe('isCancellationEligibleForCredit', () => {
  it('concede crédito com 4 horas ou mais de antecedência', () => {
    const startsAt = new Date('2026-09-03T21:00:00.000Z');
    const now = new Date('2026-09-03T17:00:00.000Z');
    assert.equal(isCancellationEligibleForCredit(now, startsAt), true);
  });

  it('concede crédito exatamente no limite de 4 horas', () => {
    const startsAt = new Date('2026-09-03T21:00:00.000Z');
    const now = new Date('2026-09-03T17:00:00.000Z');
    assert.equal(isCancellationEligibleForCredit(now, startsAt), true);
  });

  it('nega crédito um milissegundo abaixo do limite', () => {
    const startsAt = new Date('2026-09-03T21:00:00.000Z');
    const now = new Date('2026-09-03T17:00:00.001Z');
    assert.equal(isCancellationEligibleForCredit(now, startsAt), false);
  });

  it('nega crédito com menos de 4 horas', () => {
    const startsAt = new Date('2026-09-03T21:00:00.000Z');
    const now = new Date('2026-09-03T18:00:00.000Z');
    assert.equal(isCancellationEligibleForCredit(now, startsAt), false);
  });

  it('nega crédito depois que a aula começou', () => {
    const startsAt = new Date('2026-09-03T21:00:00.000Z');
    const now = new Date('2026-09-03T21:30:00.000Z');
    assert.equal(isCancellationEligibleForCredit(now, startsAt), false);
  });
});

describe('creditExpiresAt', () => {
  it('soma 30 dias a partir do início da aula, não do cancelamento', () => {
    const classStartsAt = new Date('2026-09-04T21:00:00.000Z');
    assert.equal(
      creditExpiresAt(classStartsAt).toISOString(),
      '2026-10-04T21:00:00.000Z',
    );
  });
});

describe('isOwnRegularTrainingSlot', () => {
  const regulars = [
    { weekday: 'MON' as const, startTime: '18:00' },
    { weekday: 'FRI' as const, startTime: '17:00' },
  ];

  it('reconhece o dia e o horário regulares do aluno', () => {
    assert.equal(isOwnRegularTrainingSlot('MON', '18:00', regulars), true);
    assert.equal(isOwnRegularTrainingSlot('FRI', '17:00', regulars), true);
  });

  it('permite outro horário no mesmo dia ou outro dia no mesmo horário', () => {
    assert.equal(isOwnRegularTrainingSlot('MON', '07:30', regulars), false);
    assert.equal(isOwnRegularTrainingSlot('TUE', '18:00', regulars), false);
  });
});

describe('cenários da FASE 2 com MOCK_NOW', () => {
  const now = new Date('2026-09-03T15:00:00.000Z');

  it('hoje 15:00 (3h) não gera crédito', () => {
    const startsAt = new Date('2026-09-03T18:00:00.000Z');
    assert.equal(isCancellationEligibleForCredit(now, startsAt), false);
  });

  it('hoje 18:00 (6h) gera crédito com o prazo de 4h', () => {
    const startsAt = new Date('2026-09-03T21:00:00.000Z');
    assert.equal(isCancellationEligibleForCredit(now, startsAt), true);
  });

  it('segunda 18:00 (mais de 4h) gera crédito', () => {
    const startsAt = new Date('2026-09-07T21:00:00.000Z');
    assert.equal(isCancellationEligibleForCredit(now, startsAt), true);
  });
});
