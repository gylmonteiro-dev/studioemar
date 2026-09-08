import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { remainingSpotsForRegularPair } from './regular-availability';

describe('remainingSpotsForRegularPair', () => {
  it('usa a menor folga entre aulas futuras abertas', () => {
    assert.equal(
      remainingSpotsForRegularPair([
        { enrolledCount: 4, capacity: 6, status: 'OPEN' },
        { enrolledCount: 5, capacity: 6, status: 'OPEN' },
      ]),
      1,
    );
  });

  it('esconde o par se alguma ocorrência estiver lotada', () => {
    assert.equal(
      remainingSpotsForRegularPair([
        { enrolledCount: 4, capacity: 6, status: 'OPEN' },
        { enrolledCount: 6, capacity: 6, status: 'FULL' },
      ]),
      null,
    );
  });

  it('ignora aulas fechadas e some se não houver abertas', () => {
    assert.equal(
      remainingSpotsForRegularPair([{ enrolledCount: 0, capacity: 6, status: 'CLOSED' }]),
      null,
    );
    assert.equal(
      remainingSpotsForRegularPair([
        { enrolledCount: 2, capacity: 6, status: 'OPEN' },
        { enrolledCount: 0, capacity: 6, status: 'CLOSED' },
      ]),
      4,
    );
  });
});
