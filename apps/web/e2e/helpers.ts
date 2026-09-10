import type { AuthSession, OccupancyDashboard, User } from '@studioemar/shared';
import type { Page } from '@playwright/test';

export const CLOCK_NOW = '2026-09-03T15:00:00.000Z';

export const joao: User = {
  id: 'user-joao',
  name: 'João',
  email: 'joao@studioemar.local',
  role: 'STUDENT',
  planId: 'plan-3x',
  mustSetPassword: false,
  regularSlots: [
    {
      studioHourId: 'hour-1',
      weekday: 'MON',
      name: 'Strength',
      startTime: '18:00',
      endTime: '19:00',
      classType: 'Strength',
      trainerId: 'user-carlos',
    },
  ],
};

export const carlos: User = {
  id: 'user-carlos',
  name: 'Carlos',
  email: 'carlos@studioemar.local',
  role: 'TRAINER',
  mustSetPassword: false,
  regularSlots: [],
};

export const marina: User = {
  id: 'user-marina',
  name: 'Marina',
  email: 'marina@studioemar.local',
  role: 'ADMIN',
  mustSetPassword: false,
  regularSlots: [],
};

export function authSession(user: User): AuthSession {
  return {
    accessToken: `access-${user.id}`,
    refreshToken: `refresh-${user.id}`,
    tokenType: 'Bearer',
    expiresIn: 3600,
    user,
  };
}

export const timeSlots = [
  {
    id: 'slot-today-18',
    startsAt: '2026-09-03T18:00:00.000Z',
    endsAt: '2026-09-03T19:00:00.000Z',
    capacity: 6,
    enrolledCount: 4,
    status: 'OPEN' as const,
    name: 'Strength',
    classType: 'Strength',
    trainerId: 'user-carlos',
  },
  {
    id: 'slot-mon-18',
    startsAt: '2026-09-07T21:00:00.000Z',
    endsAt: '2026-09-07T22:00:00.000Z',
    capacity: 6,
    enrolledCount: 6,
    status: 'FULL' as const,
    name: 'Strength',
    classType: 'Strength',
    trainerId: 'user-carlos',
  },
  {
    id: 'slot-open',
    startsAt: '2026-09-08T21:00:00.000Z',
    endsAt: '2026-09-08T22:00:00.000Z',
    capacity: 6,
    enrolledCount: 3,
    status: 'OPEN' as const,
    name: 'Strength',
    classType: 'Strength',
    trainerId: 'user-carlos',
  },
];

export const joaoBookings = [
  {
    id: 'booking-hoje-sem-credito',
    studentId: 'user-joao',
    timeSlotId: 'slot-today-18',
    kind: 'REGULAR' as const,
    status: 'CONFIRMED' as const,
  },
  {
    id: 'booking-seg-com-credito',
    studentId: 'user-joao',
    timeSlotId: 'slot-mon-18',
    kind: 'REGULAR' as const,
    status: 'CONFIRMED' as const,
  },
];

export const joaoCredits = [
  {
    id: 'credit-1',
    studentId: 'user-joao',
    source: 'CANCELLATION' as const,
    generatedAt: '2026-09-01T15:00:00.000Z',
    originBookingId: 'booking-origin',
    expiresAt: '2026-10-01T15:00:00.000Z',
    status: 'AVAILABLE' as const,
  },
];

export const dashboard: OccupancyDashboard = {
  metrics: {
    studentsToday: 2,
    occupancyPercent: 67,
    freeSpots: 2,
    cancellations: 2,
    makeups: 1,
  },
  byHour: [{ hour: '18:00', occupancyPercent: 83 }],
  byWeekday: [
    { weekday: 'MON', occupancyPercent: 100 },
    { weekday: 'TUE', occupancyPercent: 0 },
    { weekday: 'WED', occupancyPercent: 0 },
    { weekday: 'THU', occupancyPercent: 67 },
    { weekday: 'FRI', occupancyPercent: 50 },
  ],
};

export type ApiMocks = {
  user?: User;
  loginUser?: User;
  loginError?: { status: number; body: unknown };
  now?: string;
  credits?: typeof joaoCredits;
  bookings?: typeof joaoBookings;
};

export async function mockApi(page: Page, mocks: ApiMocks = {}): Promise<void> {
  const user = mocks.user ?? joao;
  let createdStudent: User | null = null;
  const bookings = (mocks.bookings ?? joaoBookings).map((row) => ({ ...row }));
  const slots = timeSlots.map((row) => ({ ...row }));
  await page.route(/:3001\//, async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname;

    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': '*',
        },
      });
      return;
    }

    const json = (status: number, body: unknown) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(body),
      });

    if (method === 'POST' && path === '/auth/login') {
      if (mocks.loginError) {
        return json(mocks.loginError.status, mocks.loginError.body);
      }
      return json(200, authSession(mocks.loginUser ?? joao));
    }

    if (method === 'POST' && path === '/auth/first-access') {
      return json(200, authSession(joao));
    }

    if (method === 'POST' && path === '/auth/recover') {
      return json(200, { ok: true });
    }

    if (method === 'GET' && path === '/health') {
      return json(200, { status: 'ok', now: mocks.now ?? CLOCK_NOW });
    }

    if (method === 'GET' && path === '/me') {
      return json(200, user);
    }

    if (method === 'GET' && path === '/me/bookings') {
      return json(200, user.role === 'STUDENT' ? bookings : []);
    }

    if (method === 'GET' && path === '/time-slots') {
      return json(200, slots);
    }

    if (method === 'GET' && path === '/me/credits') {
      return json(200, mocks.credits ?? (user.role === 'STUDENT' ? joaoCredits : []));
    }

    if (method === 'GET' && path === '/dashboard') {
      if (user.role === 'STUDENT') {
        return json(403, { message: 'Sem permissão' });
      }
      return json(200, dashboard);
    }

    if (method === 'GET' && path === '/plans') {
      return json(200, [
        {
          id: 'plan-3x',
          name: '3X POR SEMANA',
          weeklyFrequency: 3,
          sessionMinutes: 60,
          price: null,
          monthlyClasses: 12,
          monthlyHours: 12,
        },
      ]);
    }

    if (method === 'POST' && path === '/plans') {
      const body = JSON.parse(request.postData() ?? '{}') as {
        name?: string;
        weeklyFrequency?: number;
        sessionMinutes?: number;
        price?: number | null;
      };
      const name = (body.name ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleUpperCase('pt-BR');
      const weeklyFrequency = body.weeklyFrequency ?? 3;
      const sessionMinutes = body.sessionMinutes ?? 60;
      return json(201, {
        id: 'plan-new',
        name,
        weeklyFrequency,
        sessionMinutes,
        price: body.price ?? null,
        monthlyClasses: weeklyFrequency * 4,
        monthlyHours: (weeklyFrequency * 4 * sessionMinutes) / 60,
      });
    }

    if (method === 'GET' && path === '/closures') {
      return json(200, []);
    }

    if (method === 'GET' && path === '/recurring-slots') {
      return json(200, []);
    }

    if (method === 'GET' && path === '/studio-hours') {
      return json(200, []);
    }

    if (method === 'GET' && path === '/class-types') {
      return json(200, [{ id: 'type-aula', name: 'AULA' }]);
    }

    if (method === 'POST' && path === '/class-types') {
      const body = JSON.parse(request.postData() ?? '{}') as { name?: string };
      const name = (body.name ?? '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR');
      if (name === 'AULA') {
        return json(409, { message: 'Já existe um tipo de aula com este nome' });
      }
      return json(201, { id: 'type-new', name });
    }

    if (method === 'POST' && path === '/studio-hours') {
      const body = JSON.parse(request.postData() ?? '{}') as {
        name: string;
        weekdays: string[];
        startTime: string;
        endTime: string;
        capacity: number;
        classType: string;
        trainerId: string;
      };
      return json(201, {
        id: 'hour-1',
        name: body.name,
        weekdays: body.weekdays,
        startTime: body.startTime,
        endTime: body.endTime,
        capacity: body.capacity,
        classType: body.classType,
        trainerId: body.trainerId,
      });
    }

    if (method === 'GET' && path === '/operators') {
      return json(200, [carlos]);
    }

    if (method === 'GET' && path === '/students/regular-availability') {
      return json(200, [
        {
          studioHourId: 'hour-manha',
          name: 'Manhã 1',
          weekday: 'MON',
          startTime: '07:30',
          endTime: '08:30',
          classType: 'AULA',
          trainerId: 'user-carlos',
          capacity: 6,
          remainingSpots: 2,
        },
        {
          studioHourId: 'hour-manha',
          name: 'Manhã 1',
          weekday: 'WED',
          startTime: '07:30',
          endTime: '08:30',
          classType: 'AULA',
          trainerId: 'user-carlos',
          capacity: 6,
          remainingSpots: 2,
        },
        {
          studioHourId: 'hour-manha',
          name: 'Manhã 1',
          weekday: 'FRI',
          startTime: '07:30',
          endTime: '08:30',
          classType: 'AULA',
          trainerId: 'user-carlos',
          capacity: 6,
          remainingSpots: 4,
        },
      ]);
    }

    if (method === 'GET' && path === '/students') {
      return json(200, [joao]);
    }

    if (method === 'POST' && path === '/students') {
      const body = JSON.parse(request.postData() ?? '{}') as {
        name: string;
        email: string;
        cpf: string;
        planId: string;
        trainerIds?: string[];
        regularSlots?: Array<{ studioHourId: string; weekday: string }>;
      };
      const created = {
        id: 'user-new',
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        cpf: body.cpf.replace(/\D/g, ''),
        role: 'STUDENT' as const,
        planId: body.planId,
        trainerIds: body.trainerIds ?? [],
        mustSetPassword: true,
        isActive: true,
        regularSlots: (body.regularSlots ?? []).map((slot) => ({
          studioHourId: slot.studioHourId,
          weekday: slot.weekday,
          name: 'Manhã 1',
          startTime: '07:30',
          endTime: '08:30',
          classType: 'AULA',
          trainerId: 'user-carlos',
        })),
      };
      createdStudent = created as User;
      return json(201, created);
    }

    const studentDetail = /^\/students\/([^/]+)$/.exec(path);
    if (method === 'DELETE' && studentDetail) {
      return json(204, {});
    }
    if (method === 'GET' && studentDetail) {
      const id = studentDetail[1];
      if (id === 'user-new' && createdStudent) {
        return json(200, createdStudent);
      }
      if (id === joao.id) {
        return json(200, joao);
      }
      return json(404, { message: 'Aluno não encontrado' });
    }

    const studentBookings = /^\/students\/([^/]+)\/bookings$/.exec(path);
    if (method === 'GET' && studentBookings) {
      return json(200, studentBookings[1] === joao.id ? bookings : []);
    }

    const studentCredits = /^\/students\/([^/]+)\/credits$/.exec(path);
    if (method === 'GET' && studentCredits) {
      return json(200, studentCredits[1] === joao.id ? joaoCredits : []);
    }

    if (method === 'POST' && path === '/bookings') {
      const body = JSON.parse(request.postData() ?? '{}') as {
        timeSlotId?: string;
      };
      const created = {
        id: 'booking-remarcado',
        studentId: user.id,
        timeSlotId: body.timeSlotId ?? slots[0]?.id,
        kind: 'REGULAR' as const,
        status: 'CONFIRMED' as const,
      };
      bookings.push(created);
      const slot = slots.find((item) => item.id === created.timeSlotId);
      if (slot) {
        slot.enrolledCount += 1;
        if (slot.enrolledCount >= slot.capacity) {
          slot.status = 'FULL';
        }
      }
      return json(201, created);
    }

    const cancel = /^\/bookings\/([^/]+)\/cancellations$/.exec(path);
    if (method === 'POST' && cancel) {
      const bookingId = cancel[1];
      const generatedCredit = bookingId === 'booking-seg-com-credito';
      const booking = bookings.find((item) => item.id === bookingId);
      if (booking) {
        booking.status = 'CANCELLED';
        const slot = slots.find((item) => item.id === booking.timeSlotId);
        if (slot && slot.enrolledCount > 0) {
          slot.enrolledCount -= 1;
          if (slot.status === 'FULL') {
            slot.status = 'OPEN';
          }
        }
      }
      return json(200, {
        id: `cancel-${bookingId}`,
        bookingId,
        cancelledAt: CLOCK_NOW,
        cancelledBy: 'STUDENT',
        generatedCredit,
        ...(generatedCredit ? { creditId: 'credit-new' } : {}),
      });
    }

    return json(404, { message: `Mock ausente: ${method} ${path}` });
  });
}

export async function injectSession(page: Page, user: User): Promise<void> {
  const session = {
    accessToken: `access-${user.id}`,
    refreshToken: `refresh-${user.id}`,
    expiresAt: Date.now() + 3_600_000,
    user,
  };
  await page.addInitScript((value) => {
    localStorage.setItem('studioemar.session', JSON.stringify(value));
  }, session);
}

export async function openPublicPage(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading').first().waitFor({ state: 'visible' });
  await waitForHydration(page);
}

export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const el = document.querySelector('form, button, input, nav, aside');
    if (!el) {
      return false;
    }
    return Object.keys(el).some((key) => key.startsWith('__react'));
  });
}

export async function noHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth <= doc.clientWidth + 1;
  });
}
