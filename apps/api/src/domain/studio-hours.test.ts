import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  enumerateStudioHourOccurrences,
  intervalsOverlap,
  sortWeekdays,
} from './studio-hours';

describe('studio-hours', () => {
  it('ordena os dias da semana', () => {
    assert.deepEqual(sortWeekdays(['FRI', 'MON', 'WED']), ['MON', 'WED', 'FRI']);
  });

  it('materializa seg/qua/sex 07:30–08:30 a partir de uma quinta', () => {
    const occurrences = enumerateStudioHourOccurrences({
      weekdays: ['MON', 'WED', 'FRI'],
      startTime: '07:30',
      endTime: '08:30',
      from: new Date('2026-09-03T15:00:00.000Z'),
      weeks: 1,
    });
    assert.deepEqual(
      occurrences.map((item) => item.date),
      ['2026-09-04', '2026-09-07', '2026-09-09'],
    );
    assert.equal(occurrences[0]?.startsAt.toISOString(), '2026-09-04T10:30:00.000Z');
    assert.equal(occurrences[0]?.endsAt.toISOString(), '2026-09-04T11:30:00.000Z');
  });

  it('detecta intervalos sobrepostos', () => {
    const leftStart = new Date('2026-09-07T10:30:00.000Z');
    const leftEnd = new Date('2026-09-07T11:30:00.000Z');
    assert.equal(
      intervalsOverlap(
        leftStart,
        leftEnd,
        new Date('2026-09-07T11:00:00.000Z'),
        new Date('2026-09-07T12:00:00.000Z'),
      ),
      true,
    );
    assert.equal(
      intervalsOverlap(
        leftStart,
        leftEnd,
        new Date('2026-09-07T11:30:00.000Z'),
        new Date('2026-09-07T12:30:00.000Z'),
      ),
      false,
    );
  });
});
