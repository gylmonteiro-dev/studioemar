import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  authSessionSchema,
  bookingSchema,
  cancellationSchema,
  createStudentRequestSchema,
  createStudioClosureRequestSchema,
  creditSchema,
  firstAccessRequestSchema,
  loginRequestSchema,
  occupancyDashboardSchema,
  redeemCreditRequestSchema,
  timeSlotSchema,
  userSchema,
} from './index.js';

describe('loginRequestSchema', () => {
  it('aceita e-mail e senha', () => {
    assert.deepEqual(
      loginRequestSchema.parse({
        email: 'joao@studioemar.local',
        password: 'studioemar',
      }),
      { email: 'joao@studioemar.local', password: 'studioemar' },
    );
  });

  it('rejeita e-mail inválido', () => {
    const result = loginRequestSchema.safeParse({
      email: 'joao',
      password: 'x',
    });
    assert.equal(result.success, false);
  });
});

describe('firstAccessRequestSchema', () => {
  it('exige senha com 6 caracteres e confirmação igual', () => {
    const result = firstAccessRequestSchema.safeParse({
      email: 'ana@studioemar.local',
      password: '12345',
      confirmPassword: '12345',
    });
    assert.equal(result.success, false);

    const mismatch = firstAccessRequestSchema.safeParse({
      email: 'ana@studioemar.local',
      password: '123456',
      confirmPassword: '654321',
    });
    assert.equal(mismatch.success, false);
  });
});

describe('userSchema', () => {
  it('não aceita passwordHash no contrato público', () => {
    const user = userSchema.parse({
      id: 'user-joao',
      name: 'João',
      email: 'joao@studioemar.local',
      role: 'STUDENT',
      planId: 'plan-3x',
      mustSetPassword: false,
      passwordHash: 'secret',
    });
    assert.equal('passwordHash' in user, false);
    assert.equal(
      (user as { passwordHash?: string }).passwordHash,
      undefined,
    );
  });
});

describe('authSessionSchema', () => {
  it('exige o par JWT e o usuário', () => {
    const result = authSessionSchema.safeParse({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 'user-joao',
        name: 'João',
        email: 'joao@studioemar.local',
        role: 'STUDENT',
      },
    });
    assert.equal(result.success, true);
  });
});

describe('bookingSchema e cancellationSchema', () => {
  it('aceita reserva e cancelamento com crédito opcional', () => {
    assert.equal(
      bookingSchema.parse({
        id: 'booking-1',
        studentId: 'user-joao',
        timeSlotId: 'slot-1',
        kind: 'REGULAR',
        status: 'CONFIRMED',
      }).status,
      'CONFIRMED',
    );
    const withCredit = cancellationSchema.parse({
      id: 'cancel-1',
      bookingId: 'booking-1',
      cancelledAt: '2026-09-03T15:00:00.000Z',
      cancelledBy: 'STUDENT',
      generatedCredit: true,
      creditId: 'credit-1',
    });
    assert.equal(withCredit.creditId, 'credit-1');
    const withoutCredit = cancellationSchema.parse({
      id: 'cancel-2',
      bookingId: 'booking-2',
      cancelledAt: '2026-09-03T15:00:00.000Z',
      cancelledBy: 'STUDENT',
      generatedCredit: false,
    });
    assert.equal(withoutCredit.creditId, undefined);
  });
});

describe('creditSchema', () => {
  it('rastreia origem, validade e anulação', () => {
    const credit = creditSchema.parse({
      id: 'credit-1',
      studentId: 'user-joao',
      source: 'CANCELLATION',
      generatedAt: '2026-09-03T15:00:00.000Z',
      originBookingId: 'booking-1',
      expiresAt: '2026-10-03T15:00:00.000Z',
      status: 'ANNULLED',
      annulledAt: '2026-09-04T15:00:00.000Z',
      annulledByUserId: 'user-carlos',
    });
    assert.equal(credit.source, 'CANCELLATION');
    assert.equal(credit.status, 'ANNULLED');
  });

  it('rejeita origem avulsa', () => {
    const result = creditSchema.safeParse({
      id: 'credit-1',
      studentId: 'user-joao',
      source: 'MANUAL',
      generatedAt: '2026-09-03T15:00:00.000Z',
      expiresAt: '2026-10-03T15:00:00.000Z',
      status: 'AVAILABLE',
    });
    assert.equal(result.success, false);
  });
});

describe('redeemCreditRequestSchema', () => {
  it('exige timeSlotId', () => {
    assert.equal(
      redeemCreditRequestSchema.safeParse({}).success,
      false,
    );
    assert.equal(
      redeemCreditRequestSchema.parse({ timeSlotId: 'slot-1' }).timeSlotId,
      'slot-1',
    );
  });
});

describe('createStudentRequestSchema', () => {
  it('rejeita e-mail inválido', () => {
    const result = createStudentRequestSchema.safeParse({
      name: 'Ana',
      email: 'ana',
      planId: 'plan-3x',
    });
    assert.equal(result.success, false);
  });
});

describe('createStudioClosureRequestSchema', () => {
  it('rejeita intervalo invertido', () => {
    const result = createStudioClosureRequestSchema.safeParse({
      startsOn: '2026-09-10',
      endsOn: '2026-09-08',
      reason: 'Recesso',
    });
    assert.equal(result.success, false);
  });

  it('assume grantsCredit false', () => {
    const closure = createStudioClosureRequestSchema.parse({
      startsOn: '2026-09-08',
      endsOn: '2026-09-10',
      reason: 'Recesso',
    });
    assert.equal(closure.grantsCredit, false);
  });
});

describe('timeSlotSchema', () => {
  it('rejeita capacidade zero', () => {
    const result = timeSlotSchema.safeParse({
      id: 'slot-1',
      startsAt: '2026-09-03T21:00:00.000Z',
      endsAt: '2026-09-03T22:00:00.000Z',
      capacity: 0,
      enrolledCount: 0,
      status: 'OPEN',
      classType: 'Strength',
      trainerId: 'user-carlos',
    });
    assert.equal(result.success, false);
  });
});

describe('occupancyDashboardSchema', () => {
  it('aceita o contrato do dashboard', () => {
    const dashboard = occupancyDashboardSchema.parse({
      metrics: {
        studentsToday: 2,
        occupancyPercent: 67,
        freeSpots: 2,
        cancellations: 1,
        makeups: 1,
      },
      byHour: [{ hour: '18:00', occupancyPercent: 80 }],
      byWeekday: [{ weekday: 'THU', occupancyPercent: 67 }],
    });
    assert.equal(dashboard.metrics.freeSpots, 2);
  });
});
