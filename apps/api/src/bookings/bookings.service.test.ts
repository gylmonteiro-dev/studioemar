import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import type { Clock } from '../common/clock';
import {
  createMemoryPrisma,
  fixedClock,
  type MemoryStore,
} from '../test/memory-prisma';

const NOW = '2026-09-03T15:00:00.000Z';

const joao = {
  id: 'user-joao',
  name: 'João',
  email: 'joao@studioemar.local',
  role: 'STUDENT' as const,
  planId: 'plan-3x',
  mustSetPassword: false,
  passwordHash: 'hash',
};

const ana = {
  ...joao,
  id: 'user-ana',
  name: 'Ana',
  email: 'ana@studioemar.local',
};

const carlos = {
  id: 'user-carlos',
  name: 'Carlos',
  email: 'carlos@studioemar.local',
  role: 'TRAINER' as const,
  planId: null,
  mustSetPassword: false,
  passwordHash: 'hash',
};

const slotToday = {
  id: 'slot-today-18',
  startsAt: new Date('2026-09-03T21:00:00.000Z'),
  endsAt: new Date('2026-09-03T22:00:00.000Z'),
  capacity: 6,
  enrolledCount: 6,
  status: 'FULL' as const,
  classType: 'Strength',
  trainerId: 'user-carlos',
};

const slotMonday = {
  ...slotToday,
  id: 'slot-mon-18',
  startsAt: new Date('2026-09-07T21:00:00.000Z'),
  endsAt: new Date('2026-09-07T22:00:00.000Z'),
  enrolledCount: 2,
  status: 'OPEN' as const,
};

function service(seed: Partial<MemoryStore> = {}) {
  const { prisma, store } = createMemoryPrisma({
    users: [joao, ana, carlos],
    timeSlots: [slotToday, slotMonday],
    bookings: [
      {
        id: 'booking-hoje-sem-credito',
        studentId: 'user-joao',
        timeSlotId: 'slot-today-18',
        kind: 'REGULAR',
        status: 'CONFIRMED',
      },
      {
        id: 'booking-seg-com-credito',
        studentId: 'user-joao',
        timeSlotId: 'slot-mon-18',
        kind: 'REGULAR',
        status: 'CONFIRMED',
      },
    ],
    ...seed,
  });
  return {
    bookings: new BookingsService(prisma, fixedClock(NOW) as Clock),
    store,
  };
}

describe('BookingsService.cancel', () => {
  it('não gera crédito com menos de 12h (RN-012)', async () => {
    const { bookings, store } = service();
    const result = await bookings.cancel('booking-hoje-sem-credito', {
      id: 'user-joao',
      email: joao.email,
      role: 'STUDENT',
    });
    assert.equal(result.generatedCredit, false);
    assert.equal(result.cancelledBy, 'STUDENT');
    assert.equal(result.creditId, undefined);
    assert.equal(store.credits.length, 0);
    assert.equal(
      store.bookings.find((row) => row.id === 'booking-hoje-sem-credito')
        ?.status,
      'CANCELLED',
    );
    const slot = store.timeSlots.find((row) => row.id === 'slot-today-18');
    assert.equal(slot?.enrolledCount, 5);
    assert.equal(slot?.status, 'OPEN');
  });

  it('gera crédito CANCELLATION com 12h ou mais', async () => {
    const { bookings, store } = service();
    const result = await bookings.cancel('booking-seg-com-credito', {
      id: 'user-joao',
      email: joao.email,
      role: 'STUDENT',
    });
    assert.equal(result.generatedCredit, true);
    assert.equal(store.credits[0]?.source, 'CANCELLATION');
    assert.equal(store.credits[0]?.studentId, 'user-joao');
    assert.equal(store.credits[0]?.originBookingId, 'booking-seg-com-credito');
    assert.equal(result.creditId, store.credits[0]?.id);
  });

  it('professor cancela e sempre gera TRAINER_CANCELLATION (RN-017)', async () => {
    const { bookings, store } = service();
    const result = await bookings.cancel('booking-hoje-sem-credito', {
      id: 'user-carlos',
      email: carlos.email,
      role: 'TRAINER',
    });
    assert.equal(result.generatedCredit, true);
    assert.equal(result.cancelledBy, 'TRAINER');
    assert.equal(store.credits[0]?.source, 'TRAINER_CANCELLATION');
  });

  it('ADMIN cancela como professor', async () => {
    const { bookings, store } = service();
    await bookings.cancel('booking-hoje-sem-credito', {
      id: 'user-carlos',
      email: carlos.email,
      role: 'ADMIN',
    });
    assert.equal(store.credits[0]?.source, 'TRAINER_CANCELLATION');
  });

  it('aluno não cancela reserva de outro', async () => {
    const { bookings } = service();
    await assert.rejects(
      () =>
        bookings.cancel('booking-hoje-sem-credito', {
          id: 'user-ana',
          email: ana.email,
          role: 'STUDENT',
        }),
      ForbiddenException,
    );
  });

  it('recusa reserva inexistente ou já cancelada', async () => {
    const { bookings, store } = service();
    await assert.rejects(
      () =>
        bookings.cancel('missing', {
          id: 'user-joao',
          email: joao.email,
          role: 'STUDENT',
        }),
      NotFoundException,
    );
    const row = store.bookings.find(
      (item) => item.id === 'booking-hoje-sem-credito',
    );
    if (row) {
      row.status = 'CANCELLED';
    }
    await assert.rejects(
      () =>
        bookings.cancel('booking-hoje-sem-credito', {
          id: 'user-joao',
          email: joao.email,
          role: 'STUDENT',
        }),
      ConflictException,
    );
  });
});
