import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  clockIntervalsOverlap,
  coincidingStudioHours,
  studioHoursCoincide,
} from './studio-hours.js';

describe('studioHoursCoincide', () => {
  it('detecta 18:00–19:00 cruzando 18:30–19:00 no mesmo dia', () => {
    assert.equal(
      studioHoursCoincide(
        {
          weekdays: ['MON', 'WED', 'FRI'],
          startTime: '18:00',
          endTime: '19:00',
        },
        {
          weekdays: ['MON', 'FRI'],
          startTime: '18:30',
          endTime: '19:30',
        },
      ),
      true,
    );
  });

  it('não alerta quando os intervalos só se encostam', () => {
    assert.equal(
      clockIntervalsOverlap('18:00', '19:00', '19:00', '20:00'),
      false,
    );
  });

  it('não alerta 06:20–07:20 contra 07:30–08:30 no mesmo dia', () => {
    assert.equal(
      studioHoursCoincide(
        {
          weekdays: ['MON', 'WED', 'FRI'],
          startTime: '06:20',
          endTime: '07:20',
        },
        {
          weekdays: ['MON', 'WED', 'FRI'],
          startTime: '07:30',
          endTime: '08:30',
        },
      ),
      false,
    );
  });

  it('compara minutos mesmo com hora sem zero e segundos do input time', () => {
    assert.equal(
      clockIntervalsOverlap('6:20', '7:20', '07:30:00', '08:30:00'),
      false,
    );
  });

  it('ignora turmas sem dia em comum', () => {
    const matches = coincidingStudioHours(
      { weekdays: ['TUE'], startTime: '18:00', endTime: '19:00' },
      [
        {
          id: 'hour-1',
          weekdays: ['MON'],
          startTime: '18:00',
          endTime: '19:00',
        },
      ],
    );
    assert.equal(matches.length, 0);
  });
});
