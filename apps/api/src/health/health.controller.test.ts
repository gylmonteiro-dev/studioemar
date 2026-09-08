import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Clock } from '../common/clock';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('devolve o relógio do servidor', () => {
    const clock: Clock = {
      now: () => new Date('2026-09-08T15:00:00.000Z'),
    };
    const controller = new HealthController(clock);
    assert.deepEqual(controller.check(), {
      status: 'ok',
      now: '2026-09-08T15:00:00.000Z',
    });
  });
});
