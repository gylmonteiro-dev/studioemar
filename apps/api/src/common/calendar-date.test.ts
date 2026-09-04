import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { loginRequestSchema } from '@studioemar/shared';
import { calendarDate, dateInRange } from './calendar-date';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('calendarDate', () => {
  it('usa o dia civil em America/Sao_Paulo', () => {
    assert.equal(calendarDate(new Date('2026-09-03T15:00:00.000Z')), '2026-09-03');
    assert.equal(calendarDate(new Date('2026-09-04T02:00:00.000Z')), '2026-09-03');
  });
});

describe('dateInRange', () => {
  it('inclui as pontas', () => {
    assert.equal(dateInRange('2026-09-03', '2026-09-03', '2026-09-05'), true);
    assert.equal(dateInRange('2026-09-05', '2026-09-03', '2026-09-05'), true);
    assert.equal(dateInRange('2026-09-06', '2026-09-03', '2026-09-05'), false);
  });
});

describe('ZodValidationPipe', () => {
  it('devolve os dados validados', () => {
    const pipe = new ZodValidationPipe(loginRequestSchema);
    assert.deepEqual(
      pipe.transform({
        email: 'joao@studioemar.local',
        password: 'studioemar',
      }),
      { email: 'joao@studioemar.local', password: 'studioemar' },
    );
  });

  it('rejeita payload inválido', () => {
    const pipe = new ZodValidationPipe(loginRequestSchema);
    assert.throws(
      () => pipe.transform({ email: 'joao', password: '' }),
      BadRequestException,
    );
  });
});
