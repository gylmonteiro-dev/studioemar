import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addCalendarDays,
  civilRangeBounds,
  saoPauloDateTime,
  weekdayFromCalendarDate,
} from './calendar-date';

describe('calendar-date', () => {
  it('converte 18:00 em São Paulo para 21:00 UTC', () => {
    assert.equal(
      saoPauloDateTime('2026-09-03', '18:00').toISOString(),
      '2026-09-03T21:00:00.000Z',
    );
  });

  it('identifica segunda-feira em 2026-09-07', () => {
    assert.equal(weekdayFromCalendarDate('2026-09-07'), 'MON');
    assert.equal(weekdayFromCalendarDate('2026-09-04'), 'FRI');
    assert.equal(addCalendarDays('2026-09-03', 1), '2026-09-04');
  });

  it('converte janela civil de São Paulo em instantes UTC', () => {
    assert.deepEqual(civilRangeBounds('2026-09-03', '2026-09-03'), {
      gte: new Date('2026-09-03T03:00:00.000Z'),
      lt: new Date('2026-09-04T03:00:00.000Z'),
    });
  });
});
