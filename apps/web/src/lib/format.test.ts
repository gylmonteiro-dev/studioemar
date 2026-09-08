import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calendarDate,
  formatCpf,
  formatWeekRange,
  isInWeek,
  spotsLeft,
  startOfWeekMonday,
} from './format';

describe('spotsLeft', () => {
  it('não mostra vagas negativas', () => {
    assert.equal(spotsLeft(4, 6), 2);
    assert.equal(spotsLeft(6, 6), 0);
    assert.equal(spotsLeft(7, 6), 0);
  });
});

describe('formatCpf', () => {
  it('aplica a máscara', () => {
    assert.equal(formatCpf('52998224725'), '529.982.247-25');
  });
});

describe('semana da agenda', () => {
  it('abre na segunda da semana do relógio (08/09/2026)', () => {
    const weekStart = startOfWeekMonday('2026-09-08T15:00:00.000Z');
    assert.equal(calendarDate(weekStart.toISOString()), '2026-09-07');
    assert.equal(formatWeekRange(weekStart), '07 – 13 SET');
  });

  it('inclui aula de manhã na segunda, mesmo antes do meio-dia', () => {
    const weekStart = startOfWeekMonday('2026-09-08T15:00:00.000Z');
    assert.equal(isInWeek('2026-09-07T10:30:00.000Z', weekStart), true);
    assert.equal(isInWeek('2026-09-13T21:00:00.000Z', weekStart), true);
    assert.equal(isInWeek('2026-09-06T21:00:00.000Z', weekStart), false);
    assert.equal(isInWeek('2026-09-14T10:30:00.000Z', weekStart), false);
  });
});
