import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreditsService } from './credits.service';
import type { Clock } from '../common/clock';
import {
  createMemoryPrisma,
  fixedClock,
  type MemoryStore,
} from '../test/memory-prisma';

const NOW = '2026-09-03T15:00:00.000Z';

const openSlot = {
  id: 'slot-open',
  startsAt: new Date('2026-09-08T21:00:00.000Z'),
  endsAt: new Date('2026-09-08T22:00:00.000Z'),
  capacity: 6,
  enrolledCount: 5,
  status: 'OPEN' as const,
  classType: 'Strength',
  trainerId: 'user-carlos',
};

const fullSlot = {
  ...openSlot,
  id: 'slot-full',
  enrolledCount: 6,
  status: 'FULL' as const,
};

const closedSlot = {
  ...openSlot,
  id: 'slot-closed',
  enrolledCount: 2,
  status: 'CLOSED' as const,
};

function availableCreditDefaults() {
  return {
    id: 'credit-1',
    studentId: 'user-joao',
    source: 'CANCELLATION' as const,
    generatedAt: new Date('2026-09-01T15:00:00.000Z'),
    originBookingId: 'booking-origin',
    originClosureId: null,
    expiresAt: new Date('2026-10-01T15:00:00.000Z'),
    status: 'AVAILABLE' as const,
    usedAt: null,
    usedBookingId: null,
    annulledAt: null,
    annulledByUserId: null,
  };
}

function availableCredit(
  overrides: Partial<ReturnType<typeof availableCreditDefaults>> = {},
) {
  return { ...availableCreditDefaults(), ...overrides };
}

function service(seed: Partial<MemoryStore> = {}) {
  const { prisma, store } = createMemoryPrisma({
    timeSlots: [openSlot, fullSlot, closedSlot],
    credits: [availableCredit()],
    bookings: [],
    ...seed,
  });
  return {
    credits: new CreditsService(prisma, fixedClock(NOW) as Clock),
    store,
  };
}

describe('CreditsService', () => {
  it('marca crédito vencido como EXPIRED ao listar', async () => {
    const { credits, store } = service({
      credits: [
        availableCredit({
          expiresAt: new Date('2026-09-01T15:00:00.000Z'),
        }),
      ],
    });
    const listed = await credits.listMine('user-joao');
    assert.equal(listed[0]?.status, 'EXPIRED');
    assert.equal(store.credits[0]?.status, 'EXPIRED');
  });

  it('consome 1 crédito e cria reserva MAKEUP (RN-007 / RN-009)', async () => {
    const { credits, store } = service();
    const booking = await credits.redeem('credit-1', 'user-joao', {
      timeSlotId: 'slot-open',
    });
    assert.equal(booking.kind, 'MAKEUP');
    assert.equal(booking.status, 'CONFIRMED');
    assert.equal(store.credits[0]?.status, 'USED');
    assert.equal(store.credits[0]?.usedBookingId, booking.id);
    const slot = store.timeSlots.find((row) => row.id === 'slot-open');
    assert.equal(slot?.enrolledCount, 6);
    assert.equal(slot?.status, 'FULL');
  });

  it('recusa horário lotado ou fechado (RN-008)', async () => {
    const { credits } = service();
    await assert.rejects(
      () => credits.redeem('credit-1', 'user-joao', { timeSlotId: 'slot-full' }),
      ConflictException,
    );
    await assert.rejects(
      () =>
        credits.redeem('credit-1', 'user-joao', { timeSlotId: 'slot-closed' }),
      ConflictException,
    );
  });

  it('recusa se o aluno já está no horário', async () => {
    const { credits } = service({
      bookings: [
        {
          id: 'booking-existing',
          studentId: 'user-joao',
          timeSlotId: 'slot-open',
          kind: 'REGULAR',
          status: 'CONFIRMED',
        },
      ],
    });
    await assert.rejects(
      () => credits.redeem('credit-1', 'user-joao', { timeSlotId: 'slot-open' }),
      (error: unknown) =>
        error instanceof ConflictException &&
        String(error.message).includes('já está'),
    );
  });

  it('aluno não usa crédito de outro', async () => {
    const { credits } = service();
    await assert.rejects(
      () => credits.redeem('credit-1', 'user-ana', { timeSlotId: 'slot-open' }),
      ForbiddenException,
    );
  });

  it('recusa crédito inexistente, usado ou expirado', async () => {
    const { credits } = service();
    await assert.rejects(
      () => credits.redeem('missing', 'user-joao', { timeSlotId: 'slot-open' }),
      NotFoundException,
    );
    const used = service({
      credits: [availableCredit({ status: 'USED' })],
    });
    await assert.rejects(
      () =>
        used.credits.redeem('credit-1', 'user-joao', {
          timeSlotId: 'slot-open',
        }),
      ConflictException,
    );
  });

  it('anula crédito disponível e preserva histórico (RN-018)', async () => {
    const { credits, store } = service();
    const result = await credits.annul('credit-1', 'user-carlos');
    assert.equal(result.status, 'ANNULLED');
    assert.equal(store.credits[0]?.annulledByUserId, 'user-carlos');
    await assert.rejects(
      () => credits.annul('credit-1', 'user-carlos'),
      ConflictException,
    );
  });

  it('não impõe teto semanal: dois créditos AVAILABLE (RN-020)', async () => {
    const { credits } = service({
      credits: [
        availableCredit({ id: 'credit-a' }),
        availableCredit({ id: 'credit-b' }),
      ],
    });
    const listed = await credits.listMine('user-joao');
    assert.equal(listed.filter((item) => item.status === 'AVAILABLE').length, 2);
  });
});
