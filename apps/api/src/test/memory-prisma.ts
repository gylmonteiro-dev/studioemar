import type { PrismaService } from '../prisma/prisma.service';

export type MemoryUser = {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TRAINER' | 'ADMIN';
  planId: string | null;
  mustSetPassword: boolean;
  passwordHash: string | null;
};

export type MemoryPlan = {
  id: string;
  name: string;
  weeklyFrequency: number;
};

export type MemoryTimeSlot = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  enrolledCount: number;
  status: 'OPEN' | 'FULL' | 'CLOSED';
  classType: string;
  trainerId: string;
};

export type MemoryBooking = {
  id: string;
  studentId: string;
  timeSlotId: string;
  kind: 'REGULAR' | 'MAKEUP';
  status: 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
};

export type MemoryCredit = {
  id: string;
  studentId: string;
  source: 'CANCELLATION' | 'TRAINER_CANCELLATION' | 'CLOSURE_COMPENSATION';
  generatedAt: Date;
  originBookingId: string | null;
  originClosureId: string | null;
  expiresAt: Date;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED' | 'ANNULLED';
  usedAt: Date | null;
  usedBookingId: string | null;
  annulledAt: Date | null;
  annulledByUserId: string | null;
};

export type MemoryCancellation = {
  id: string;
  bookingId: string;
  cancelledAt: Date;
  cancelledBy: 'STUDENT' | 'TRAINER';
  generatedCredit: boolean;
  creditId: string | null;
};

export type MemoryRecurringSlot = {
  id: string;
  planId: string;
  weekday: string;
  time: string;
};

export type MemoryClosure = {
  id: string;
  startsOn: Date;
  endsOn: Date;
  reason: string;
  createdByUserId: string;
  grantsCredit: boolean;
};

export type MemoryWaitlist = {
  id: string;
  timeSlotId: string;
  studentId: string;
  position: number;
  enqueuedAt: Date;
  status: 'WAITING' | 'PROMOTED' | 'CANCELLED';
};

export type MemoryStore = {
  users: MemoryUser[];
  plans: MemoryPlan[];
  timeSlots: MemoryTimeSlot[];
  bookings: MemoryBooking[];
  credits: MemoryCredit[];
  cancellations: MemoryCancellation[];
  recurringSlots: MemoryRecurringSlot[];
  closures: MemoryClosure[];
  waitlist: MemoryWaitlist[];
};

type Where = Record<string, unknown>;

function cloneStore(store: MemoryStore): MemoryStore {
  return structuredClone(store);
}

function matchScalar(value: unknown, expected: unknown): boolean {
  if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
    const filter = expected as { lt?: Date; gt?: Date };
    if (filter.lt instanceof Date && value instanceof Date) {
      return value < filter.lt;
    }
    if (filter.gt instanceof Date && value instanceof Date) {
      return value > filter.gt;
    }
  }
  return value === expected;
}

function matches(row: Record<string, unknown>, where?: Where): boolean {
  if (!where) {
    return true;
  }
  return Object.entries(where).every(([key, expected]) => {
    if (key === 'planId_weekday_time' && expected && typeof expected === 'object') {
      const compound = expected as { planId: string; weekday: string; time: string };
      return (
        row.planId === compound.planId &&
        row.weekday === compound.weekday &&
        row.time === compound.time
      );
    }
    return matchScalar(row[key], expected);
  });
}

function compare(left: unknown, right: unknown): number {
  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }
  if (typeof left === 'string' && typeof right === 'string') {
    return left.localeCompare(right);
  }
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }
  return 0;
}

function sortRows<T extends Record<string, unknown>>(
  rows: T[],
  orderBy?: unknown,
): T[] {
  if (!orderBy) {
    return rows;
  }
  const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((left, right) => {
    for (const order of orders) {
      const [field, direction] = Object.entries(order as Record<string, unknown>)[0] ?? [];
      if (!field) {
        continue;
      }
      if (direction && typeof direction === 'object') {
        const [nestedField, nestedDir] = Object.entries(
          direction as Record<string, string>,
        )[0] ?? [];
        const nestedLeft = (left[field] as Record<string, unknown> | undefined)?.[
          nestedField ?? ''
        ];
        const nestedRight = (right[field] as Record<string, unknown> | undefined)?.[
          nestedField ?? ''
        ];
        const nested = compare(nestedLeft, nestedRight);
        if (nested !== 0) {
          return nestedDir === 'desc' ? -nested : nested;
        }
        continue;
      }
      const result = compare(left[field], right[field]);
      if (result !== 0) {
        return direction === 'desc' ? -result : result;
      }
    }
    return 0;
  });
}

function nextId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createMemoryPrisma(seed: Partial<MemoryStore> = {}): {
  prisma: PrismaService;
  store: MemoryStore;
} {
  const store: MemoryStore = {
    users: structuredClone(seed.users ?? []),
    plans: structuredClone(seed.plans ?? []),
    timeSlots: structuredClone(seed.timeSlots ?? []),
    bookings: structuredClone(seed.bookings ?? []),
    credits: structuredClone(seed.credits ?? []),
    cancellations: structuredClone(seed.cancellations ?? []),
    recurringSlots: structuredClone(seed.recurringSlots ?? []),
    closures: structuredClone(seed.closures ?? []),
    waitlist: structuredClone(seed.waitlist ?? []),
  };

  function includeBooking(row: MemoryBooking, include?: Where) {
    return {
      ...row,
      timeSlot: include?.timeSlot
        ? store.timeSlots.find((slot) => slot.id === row.timeSlotId)
        : undefined,
      cancellation: include?.cancellation
        ? (store.cancellations.find((item) => item.bookingId === row.id) ?? null)
        : undefined,
      student: include?.student
        ? store.users.find((user) => user.id === row.studentId)
        : undefined,
    };
  }

  const delegate = {
    user: {
      async findMany(args: { where?: Where; orderBy?: unknown } = {}) {
        return sortRows(
          store.users.filter((row) => matches(row, args.where)),
          args.orderBy,
        );
      },
      async findUnique(args: { where: Where }) {
        return (
          store.users.find((row) => matches(row, args.where)) ?? null
        );
      },
      async findFirst(args: { where?: Where } = {}) {
        return store.users.find((row) => matches(row, args.where)) ?? null;
      },
      async create(args: { data: Partial<MemoryUser> & { name: string; email: string } }) {
        const row: MemoryUser = {
          id: args.data.id ?? nextId('user'),
          name: args.data.name,
          email: args.data.email,
          role: args.data.role ?? 'STUDENT',
          planId: args.data.planId ?? null,
          mustSetPassword: args.data.mustSetPassword ?? false,
          passwordHash: args.data.passwordHash ?? null,
        };
        store.users.push(row);
        return row;
      },
      async update(args: { where: Where; data: Partial<MemoryUser> }) {
        const row = store.users.find((item) => matches(item, args.where));
        if (!row) {
          throw new Error('User not found');
        }
        Object.assign(row, args.data);
        return row;
      },
    },
    plan: {
      async findMany(args: { orderBy?: unknown } = {}) {
        return sortRows(store.plans, args.orderBy);
      },
      async findUnique(args: { where: Where }) {
        return store.plans.find((row) => matches(row, args.where)) ?? null;
      },
    },
    timeSlot: {
      async findMany(args: { orderBy?: unknown } = {}) {
        return sortRows(store.timeSlots, args.orderBy);
      },
      async findUnique(args: { where: Where }) {
        return store.timeSlots.find((row) => matches(row, args.where)) ?? null;
      },
      async findUniqueOrThrow(args: { where: Where }) {
        const row = store.timeSlots.find((item) => matches(item, args.where));
        if (!row) {
          throw new Error('TimeSlot not found');
        }
        return row;
      },
      async update(args: { where: Where; data: Partial<MemoryTimeSlot> }) {
        const row = store.timeSlots.find((item) => matches(item, args.where));
        if (!row) {
          throw new Error('TimeSlot not found');
        }
        Object.assign(row, args.data);
        return row;
      },
    },
    booking: {
      async findMany(args: {
        where?: Where;
        include?: Where;
        orderBy?: unknown;
      } = {}) {
        const rows = store.bookings
          .filter((row) => matches(row, args.where))
          .map((row) => includeBooking(row, args.include));
        return sortRows(rows, args.orderBy);
      },
      async findUnique(args: { where: Where; include?: Where }) {
        const row = store.bookings.find((item) => matches(item, args.where));
        return row ? includeBooking(row, args.include) : null;
      },
      async findFirst(args: { where?: Where } = {}) {
        return store.bookings.find((row) => matches(row, args.where)) ?? null;
      },
      async create(args: {
        data: Pick<MemoryBooking, 'studentId' | 'timeSlotId' | 'kind' | 'status'> & {
          id?: string;
        };
      }) {
        const row: MemoryBooking = {
          id: args.data.id ?? nextId('booking'),
          studentId: args.data.studentId,
          timeSlotId: args.data.timeSlotId,
          kind: args.data.kind,
          status: args.data.status,
        };
        store.bookings.push(row);
        return row;
      },
      async update(args: { where: Where; data: Partial<MemoryBooking> }) {
        const row = store.bookings.find((item) => matches(item, args.where));
        if (!row) {
          throw new Error('Booking not found');
        }
        Object.assign(row, args.data);
        return row;
      },
    },
    credit: {
      async findMany(args: { where?: Where; orderBy?: unknown } = {}) {
        return sortRows(
          store.credits.filter((row) => matches(row, args.where)),
          args.orderBy,
        );
      },
      async findUnique(args: { where: Where }) {
        return store.credits.find((row) => matches(row, args.where)) ?? null;
      },
      async create(args: { data: Partial<MemoryCredit> & { studentId: string } }) {
        const row: MemoryCredit = {
          id: args.data.id ?? nextId('credit'),
          studentId: args.data.studentId,
          source: args.data.source ?? 'CANCELLATION',
          generatedAt: args.data.generatedAt ?? new Date(),
          originBookingId: args.data.originBookingId ?? null,
          originClosureId: args.data.originClosureId ?? null,
          expiresAt: args.data.expiresAt ?? new Date(),
          status: args.data.status ?? 'AVAILABLE',
          usedAt: args.data.usedAt ?? null,
          usedBookingId: args.data.usedBookingId ?? null,
          annulledAt: args.data.annulledAt ?? null,
          annulledByUserId: args.data.annulledByUserId ?? null,
        };
        store.credits.push(row);
        return row;
      },
      async update(args: { where: Where; data: Partial<MemoryCredit> }) {
        const row = store.credits.find((item) => matches(item, args.where));
        if (!row) {
          throw new Error('Credit not found');
        }
        Object.assign(row, args.data);
        return row;
      },
      async updateMany(args: { where?: Where; data: Partial<MemoryCredit> }) {
        const matched = store.credits.filter((row) => matches(row, args.where));
        matched.forEach((row) => Object.assign(row, args.data));
        return { count: matched.length };
      },
    },
    cancellation: {
      async create(args: { data: Omit<MemoryCancellation, 'id'> & { id?: string } }) {
        const row: MemoryCancellation = {
          id: args.data.id ?? nextId('cancellation'),
          bookingId: args.data.bookingId,
          cancelledAt: args.data.cancelledAt,
          cancelledBy: args.data.cancelledBy,
          generatedCredit: args.data.generatedCredit,
          creditId: args.data.creditId ?? null,
        };
        store.cancellations.push(row);
        return row;
      },
      async count() {
        return store.cancellations.length;
      },
    },
    recurringSlot: {
      async findMany(args: { orderBy?: unknown } = {}) {
        return sortRows(store.recurringSlots, args.orderBy);
      },
      async findUnique(args: { where: Where }) {
        return (
          store.recurringSlots.find((row) => matches(row, args.where)) ?? null
        );
      },
      async create(args: {
        data: Pick<MemoryRecurringSlot, 'planId' | 'weekday' | 'time'> & { id?: string };
      }) {
        const row: MemoryRecurringSlot = {
          id: args.data.id ?? nextId('recurring'),
          planId: args.data.planId,
          weekday: args.data.weekday,
          time: args.data.time,
        };
        store.recurringSlots.push(row);
        return row;
      },
      async delete(args: { where: Where }) {
        const index = store.recurringSlots.findIndex((row) =>
          matches(row, args.where),
        );
        if (index < 0) {
          throw new Error('RecurringSlot not found');
        }
        const [removed] = store.recurringSlots.splice(index, 1);
        if (!removed) {
          throw new Error('RecurringSlot not found');
        }
        return removed;
      },
    },
    studioClosure: {
      async findMany(args: { orderBy?: unknown } = {}) {
        return sortRows(store.closures, args.orderBy);
      },
      async create(args: {
        data: Omit<MemoryClosure, 'id'> & { id?: string };
      }) {
        const row: MemoryClosure = {
          id: args.data.id ?? nextId('closure'),
          startsOn: args.data.startsOn,
          endsOn: args.data.endsOn,
          reason: args.data.reason,
          createdByUserId: args.data.createdByUserId,
          grantsCredit: args.data.grantsCredit,
        };
        store.closures.push(row);
        return row;
      },
    },
    waitlistEntry: {
      async findMany(args: { where?: Where; orderBy?: unknown } = {}) {
        return sortRows(
          store.waitlist.filter((row) => matches(row, args.where)),
          args.orderBy,
        );
      },
    },
    async $transaction<T>(fn: (tx: typeof delegate) => Promise<T>): Promise<T> {
      const snapshot = cloneStore(store);
      try {
        return await fn(delegate);
      } catch (error) {
        store.users.splice(0, store.users.length, ...snapshot.users);
        store.plans.splice(0, store.plans.length, ...snapshot.plans);
        store.timeSlots.splice(0, store.timeSlots.length, ...snapshot.timeSlots);
        store.bookings.splice(0, store.bookings.length, ...snapshot.bookings);
        store.credits.splice(0, store.credits.length, ...snapshot.credits);
        store.cancellations.splice(
          0,
          store.cancellations.length,
          ...snapshot.cancellations,
        );
        store.recurringSlots.splice(
          0,
          store.recurringSlots.length,
          ...snapshot.recurringSlots,
        );
        store.closures.splice(0, store.closures.length, ...snapshot.closures);
        store.waitlist.splice(0, store.waitlist.length, ...snapshot.waitlist);
        throw error;
      }
    },
  };

  return { prisma: delegate as unknown as PrismaService, store };
}

export function fixedClock(iso: string) {
  return { now: () => new Date(iso) };
}
