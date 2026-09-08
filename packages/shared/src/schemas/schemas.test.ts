import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  authSessionSchema,
  bookingSchema,
  cancellationSchema,
  createStudentRequestSchema,
  createStudioClosureRequestSchema,
  createStudioHourRequestSchema,
  createClassTypeRequestSchema,
  createPlanRequestSchema,
  creditSchema,
  firstAccessRequestSchema,
  healthSchema,
  loginRequestSchema,
  occupancyDashboardSchema,
  redeemCreditRequestSchema,
  timeSlotSchema,
  userSchema,
  listOperatorsQuerySchema,
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
      cpf: '529.982.247-25',
      planId: 'plan-3x',
      regularSlots: [{ studioHourId: 'hour-1', weekday: 'MON' }],
    });
    assert.equal(result.success, false);
  });

  it('normaliza CPF e recusa dia repetido', () => {
    const parsed = createStudentRequestSchema.parse({
      name: 'Ana Silva',
      email: 'ana@studioemar.local',
      cpf: '529.982.247-25',
      planId: 'plan-3x',
      regularSlots: [
        { studioHourId: 'hour-1', weekday: 'MON' },
        { studioHourId: 'hour-1', weekday: 'WED' },
      ],
    });
    assert.equal(parsed.cpf, '52998224725');
    const repeated = createStudentRequestSchema.safeParse({
      name: 'Ana Silva',
      email: 'ana@studioemar.local',
      cpf: '52998224725',
      planId: 'plan-3x',
      regularSlots: [
        { studioHourId: 'hour-1', weekday: 'MON' },
        { studioHourId: 'hour-2', weekday: 'MON' },
      ],
    });
    assert.equal(repeated.success, false);
    const invalidCpf = createStudentRequestSchema.safeParse({
      name: 'Ana Silva',
      email: 'ana@studioemar.local',
      cpf: '000.000.000-00',
      planId: 'plan-3x',
      regularSlots: [{ studioHourId: 'hour-1', weekday: 'MON' }],
    });
    assert.equal(invalidCpf.success, false);
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
      name: 'Strength',
      classType: 'Strength',
      trainerId: 'user-carlos',
    });
    assert.equal(result.success, false);
  });
});

describe('createStudioHourRequestSchema', () => {
  it('ordena os dias e rejeita intervalo invertido', () => {
    const hour = createStudioHourRequestSchema.parse({
      name: 'Manhã funcional',
      weekdays: ['FRI', 'MON', 'WED'],
      startTime: '07:30',
      endTime: '08:30',
      capacity: 6,
      classType: ' Funcional ',
      trainerId: 'user-carlos',
    });
    assert.deepEqual(hour.weekdays, ['MON', 'WED', 'FRI']);
    assert.equal(hour.classType, 'FUNCIONAL');
    assert.equal(hour.name, 'Manhã funcional');
    const withSeconds = createStudioHourRequestSchema.parse({
      name: 'Turma 06:20',
      weekdays: ['MON'],
      startTime: '06:20:00',
      endTime: '07:20:00',
      capacity: 6,
      classType: 'Aula',
      trainerId: 'user-carlos',
    });
    assert.equal(withSeconds.startTime, '06:20');
    assert.equal(withSeconds.endTime, '07:20');
    const inverted = createStudioHourRequestSchema.safeParse({
      name: 'Invertido',
      weekdays: ['MON'],
      startTime: '08:30',
      endTime: '07:30',
      capacity: 6,
      classType: 'Aula',
      trainerId: 'user-carlos',
    });
    assert.equal(inverted.success, false);
  });
});

describe('createClassTypeRequestSchema', () => {
  it('grava o nome em maiúsculas', () => {
    const type = createClassTypeRequestSchema.parse({ name: ' funcional ' });
    assert.equal(type.name, 'FUNCIONAL');
  });
});

describe('createPlanRequestSchema', () => {
  it('grava o nome em maiúsculas e assume 60 minutos', () => {
    const plan = createPlanRequestSchema.parse({
      name: ' 3x por semana ',
      weeklyFrequency: 3,
    });
    assert.equal(plan.name, '3X POR SEMANA');
    assert.equal(plan.sessionMinutes, 60);
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

describe('listOperatorsQuerySchema', () => {
  it('aceita teaching e omite o parâmetro', () => {
    assert.equal(
      listOperatorsQuerySchema.parse({ for: 'teaching' }).for,
      'teaching',
    );
    assert.equal(listOperatorsQuerySchema.parse({}).for, undefined);
  });

  it('rejeita outro valor', () => {
    assert.equal(
      listOperatorsQuerySchema.safeParse({ for: 'management' }).success,
      false,
    );
  });
});

describe('healthSchema', () => {
  it('exige status ok e o relógio da API', () => {
    const health = healthSchema.parse({
      status: 'ok',
      now: '2026-09-08T15:00:00.000Z',
    });
    assert.equal(health.now, '2026-09-08T15:00:00.000Z');
  });

  it('rejeita health sem relógio', () => {
    const result = healthSchema.safeParse({ status: 'ok' });
    assert.equal(result.success, false);
  });
});
