import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applySeatChange, isSlotBookable } from './slot-occupancy';

describe('applySeatChange', () => {
  it('abre o horário ao liberar a última vaga', () => {
    assert.deepEqual(
      applySeatChange(
        { enrolledCount: 6, capacity: 6, status: 'FULL' },
        -1,
      ),
      { enrolledCount: 5, status: 'OPEN' },
    );
  });

  it('marca lotado ao atingir a capacidade', () => {
    assert.deepEqual(
      applySeatChange(
        { enrolledCount: 5, capacity: 6, status: 'OPEN' },
        1,
      ),
      { enrolledCount: 6, status: 'FULL' },
    );
  });

  it('mantém CLOSED em fechamento mesmo com vaga', () => {
    assert.deepEqual(
      applySeatChange(
        { enrolledCount: 3, capacity: 6, status: 'CLOSED' },
        -1,
      ),
      { enrolledCount: 2, status: 'CLOSED' },
    );
  });
});

describe('isSlotBookable', () => {
  it('recusa lotado ou fechado', () => {
    assert.equal(
      isSlotBookable({ enrolledCount: 6, capacity: 6, status: 'FULL' }),
      false,
    );
    assert.equal(
      isSlotBookable({ enrolledCount: 2, capacity: 6, status: 'CLOSED' }),
      false,
    );
    assert.equal(
      isSlotBookable({ enrolledCount: 2, capacity: 6, status: 'OPEN' }),
      true,
    );
  });
});
