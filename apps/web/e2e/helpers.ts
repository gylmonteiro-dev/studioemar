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
};

export const carlos: User = {
  id: 'user-carlos',
  name: 'Carlos',
  email: 'carlos@studioemar.local',
  role: 'TRAINER',
  mustSetPassword: false,
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
    startsAt: '2026-09-03T21:00:00.000Z',
    endsAt: '2026-09-03T22:00:00.000Z',
    capacity: 6,
    enrolledCount: 4,
    status: 'OPEN' as const,
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
};

export async function mockApi(page: Page, mocks: ApiMocks = {}): Promise<void> {
  const user = mocks.user ?? joao;
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

    if (method === 'GET' && path === '/me') {
      return json(200, user);
    }

    if (method === 'GET' && path === '/me/bookings') {
      return json(200, user.role === 'STUDENT' ? joaoBookings : []);
    }

    if (method === 'GET' && path === '/time-slots') {
      return json(200, timeSlots);
    }

    if (method === 'GET' && path === '/me/credits') {
      return json(200, joaoCredits);
    }

    if (method === 'GET' && path === '/dashboard') {
      if (user.role === 'STUDENT') {
        return json(403, { message: 'Sem permissão' });
      }
      return json(200, dashboard);
    }

    const cancel = /^\/bookings\/([^/]+)\/cancellations$/.exec(path);
    if (method === 'POST' && cancel) {
      const bookingId = cancel[1];
      const generatedCredit = bookingId === 'booking-seg-com-credito';
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
    sessionStorage.setItem('studioemar.session', JSON.stringify(value));
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
