import type { PrismaService } from '../prisma/prisma.service';

export type MemoryUser = {
  id: string;
  name: string;
  email: string;
  cpf?: string | null;
  role: 'STUDENT' | 'TRAINER' | 'ADMIN' | 'SUPERADMIN';
  planId: string | null;
  mustSetPassword: boolean;
  isActive?: boolean;
  passwordHash: string | null;
};

export type MemoryPlan = {
  id: string;
  name: string;
  weeklyFrequency: number;
  sessionMinutes: number;
  price: number | null;
};

export type MemoryTimeSlot = {
  id: string;
  name: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  enrolledCount: number;
  status: 'OPEN' | 'FULL' | 'CLOSED';
  classType: string;
  trainerId: string;
  studioHourId?: string | null;
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

export type MemoryStudioHour = {
  id: string;
  name: string;
  weekdays: string[];
  startTime: string;
  endTime: string;
  capacity: number;
  classType: string;
  trainerId: string;
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

export type MemoryClassType = {
  id: string;
  name: string;
};

export type MemoryStudentTrainer = {
  studentId: string;
  trainerId: string;
};

export type MemoryStudentRegularSlot = {
  id: string;
  studentId: string;
  studioHourId: string;
  weekday: string;
};

export type MemoryStore = {
  users: MemoryUser[];
  plans: MemoryPlan[];
  timeSlots: MemoryTimeSlot[];
  bookings: MemoryBooking[];
  credits: MemoryCredit[];
  cancellations: MemoryCancellation[];
  recurringSlots: MemoryRecurringSlot[];
  studioHours: MemoryStudioHour[];
  classTypes: MemoryClassType[];
  closures: MemoryClosure[];
  waitlist: MemoryWaitlist[];
  studentTrainers: MemoryStudentTrainer[];
  studentRegularSlots: MemoryStudentRegularSlot[];
};

type Where = Record<string, unknown>;

function cloneStore(store: MemoryStore): MemoryStore {
  return structuredClone(store);
}

function matchScalar(value: unknown, expected: unknown): boolean {
  if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
    const filter = expected as {
      lt?: Date;
      gt?: Date;
      gte?: Date;
      lte?: Date;
      in?: unknown[];
      notIn?: unknown[];
      not?: unknown;
    };
    const hasDate =
      filter.lt instanceof Date ||
      filter.gt instanceof Date ||
      filter.gte instanceof Date ||
      filter.lte instanceof Date;
    if (hasDate) {
      if (!(value instanceof Date)) {
        return false;
      }
      if (filter.lt instanceof Date && !(value < filter.lt)) {
        return false;
      }
      if (filter.gt instanceof Date && !(value > filter.gt)) {
        return false;
      }
      if (filter.gte instanceof Date && !(value >= filter.gte)) {
        return false;
      }
      if (filter.lte instanceof Date && !(value <= filter.lte)) {
        return false;
      }
      return true;
    }
    if (Array.isArray(filter.in)) {
      return filter.in.includes(value);
    }
    if (Array.isArray(filter.notIn)) {
      return !filter.notIn.includes(value);
    }
    if ('not' in filter) {
      return value !== filter.not;
    }
  }
  return value === expected;
}

function matches(row: Record<string, unknown>, where?: Where): boolean {
  if (!where) {
    return true;
  }
  return Object.entries(where).every(([key, expected]) => {
    if (key === 'AND' && Array.isArray(expected)) {
      return expected.every((clause) => matches(row, clause as Where));
    }
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
    users: structuredClone(seed.users ?? []).map((user) => ({
      ...user,
      isActive: user.isActive ?? true,
    })),
    plans: structuredClone(
      (seed.plans ?? []).map((plan) => ({
        sessionMinutes: 60,
        price: null as number | null,
        ...plan,
      })),
    ),
    timeSlots: structuredClone(seed.timeSlots ?? []),
    bookings: structuredClone(seed.bookings ?? []),
    credits: structuredClone(seed.credits ?? []),
    cancellations: structuredClone(seed.cancellations ?? []),
    recurringSlots: structuredClone(seed.recurringSlots ?? []),
    studioHours: structuredClone(seed.studioHours ?? []),
    classTypes: structuredClone(seed.classTypes ?? []),
    closures: structuredClone(seed.closures ?? []),
    waitlist: structuredClone(seed.waitlist ?? []),
    studentTrainers: structuredClone(seed.studentTrainers ?? []),
    studentRegularSlots: structuredClone(seed.studentRegularSlots ?? []),
  };

  function includeUser(row: MemoryUser, include?: Where) {
    if (!include) {
      return row;
    }
    const studentRegularSlots = include.studentRegularSlots
      ? store.studentRegularSlots
          .filter((slot) => slot.studentId === row.id)
          .map((slot) => ({
            ...slot,
            studioHour: store.studioHours.find(
              (hour) => hour.id === slot.studioHourId,
            ),
          }))
      : undefined;
    return {
      ...row,
      studentTrainerLinks: include.studentTrainerLinks
        ? store.studentTrainers.filter((link) => link.studentId === row.id)
        : undefined,
      studentRegularSlots,
    };
  }

  function includeBooking(row: MemoryBooking, include?: Where) {
    const cancellation = include?.cancellation
      ? (store.cancellations.find((item) => item.bookingId === row.id) ?? null)
      : undefined;
    const cancellationInclude =
      include?.cancellation && typeof include.cancellation === 'object'
        ? include.cancellation
        : undefined;
    return {
      ...row,
      timeSlot: include?.timeSlot
        ? store.timeSlots.find((slot) => slot.id === row.timeSlotId)
        : undefined,
      cancellation:
        cancellation === undefined
          ? undefined
          : cancellation && cancellationInclude?.include?.credit
            ? {
                ...cancellation,
                credit: cancellation.creditId
                  ? (store.credits.find(
                      (item) => item.id === cancellation.creditId,
                    ) ?? null)
                  : null,
              }
            : cancellation,
      student: include?.student
        ? store.users.find((user) => user.id === row.studentId)
        : undefined,
    };
  }

  const delegate = {
    user: {
      async findMany(args: {
        where?: Where;
        include?: Where;
        orderBy?: unknown;
      } = {}) {
        return sortRows(
          store.users
            .filter((row) => matches(row, args.where))
            .map((row) => includeUser(row, args.include)),
          args.orderBy,
        );
      },
      async findUnique(args: { where: Where; include?: Where }) {
        const row = store.users.find((item) => matches(item, args.where));
        return row ? includeUser(row, args.include) : null;
      },
      async findUniqueOrThrow(args: { where: Where; include?: Where }) {
        const row = store.users.find((item) => matches(item, args.where));
        if (!row) {
          throw new Error('User not found');
        }
        return includeUser(row, args.include);
      },
      async findFirst(args: { where?: Where; include?: Where } = {}) {
        const row = store.users.find((item) => matches(item, args.where));
        return row ? includeUser(row, args.include) : null;
      },
      async create(args: {
        data: Partial<MemoryUser> & { name: string; email: string };
      }) {
        const row: MemoryUser = {
          id: args.data.id ?? nextId('user'),
          name: args.data.name,
          email: args.data.email,
          cpf: args.data.cpf ?? null,
          role: args.data.role ?? 'STUDENT',
          planId: args.data.planId ?? null,
          mustSetPassword: args.data.mustSetPassword ?? false,
          isActive: args.data.isActive ?? true,
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
      async count(args: { where?: Where } = {}) {
        return store.users.filter((row) => matches(row, args.where)).length;
      },
      async delete(args: { where: Where }) {
        const index = store.users.findIndex((row) => matches(row, args.where));
        if (index < 0) {
          throw new Error('User not found');
        }
        const [removed] = store.users.splice(index, 1);
        if (!removed) {
          throw new Error('User not found');
        }
        return removed;
      },
    },
    plan: {
      async findMany(args: { orderBy?: unknown } = {}) {
        return sortRows(store.plans, args.orderBy);
      },
      async findUnique(args: { where: Where }) {
        return store.plans.find((row) => matches(row, args.where)) ?? null;
      },
      async create(args: {
        data: Omit<MemoryPlan, 'id'> & { id?: string };
      }) {
        const row: MemoryPlan = {
          id: args.data.id ?? nextId('plan'),
          name: args.data.name,
          weeklyFrequency: args.data.weeklyFrequency,
          sessionMinutes: args.data.sessionMinutes,
          price: args.data.price ?? null,
        };
        store.plans.push(row);
        return row;
      },
      async update(args: { where: Where; data: Partial<MemoryPlan> }) {
        const row = store.plans.find((item) => matches(item, args.where));
        if (!row) {
          throw new Error('Plan not found');
        }
        Object.assign(row, args.data);
        return row;
      },
      async delete(args: { where: Where }) {
        const index = store.plans.findIndex((row) => matches(row, args.where));
        if (index < 0) {
          throw new Error('Plan not found');
        }
        const [removed] = store.plans.splice(index, 1);
        if (!removed) {
          throw new Error('Plan not found');
        }
        return removed;
      },
    },
    timeSlot: {
      async findMany(args: { where?: Where; orderBy?: unknown } = {}) {
        return sortRows(
          store.timeSlots.filter((row) => matches(row, args.where)),
          args.orderBy,
        );
      },
      async findUnique(args: { where: Where }) {
        return store.timeSlots.find((row) => matches(row, args.where)) ?? null;
      },
      async findFirst(args: { where?: Where } = {}) {
        return store.timeSlots.find((row) => matches(row, args.where)) ?? null;
      },
      async findUniqueOrThrow(args: { where: Where }) {
        const row = store.timeSlots.find((item) => matches(item, args.where));
        if (!row) {
          throw new Error('TimeSlot not found');
        }
        return row;
      },
      async create(args: {
        data: Omit<MemoryTimeSlot, 'id'> & { id?: string };
      }) {
        const studioHourId = args.data.studioHourId ?? null;
        if (studioHourId) {
          const duplicate = store.timeSlots.find(
            (item) =>
              item.studioHourId === studioHourId &&
              item.startsAt.getTime() === args.data.startsAt.getTime(),
          );
          if (duplicate) {
            throw new Error('TimeSlot already exists for this studio hour');
          }
        }
        const row: MemoryTimeSlot = {
          id: args.data.id ?? nextId('slot'),
          name: args.data.name,
          startsAt: args.data.startsAt,
          endsAt: args.data.endsAt,
          capacity: args.data.capacity,
          enrolledCount: args.data.enrolledCount,
          status: args.data.status,
          classType: args.data.classType,
          trainerId: args.data.trainerId,
          studioHourId,
        };
        store.timeSlots.push(row);
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
      async delete(args: { where: Where }) {
        const index = store.timeSlots.findIndex((row) => matches(row, args.where));
        if (index < 0) {
          throw new Error('TimeSlot not found');
        }
        const [removed] = store.timeSlots.splice(index, 1);
        if (!removed) {
          throw new Error('TimeSlot not found');
        }
        return removed;
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
      async findFirst(args: { where?: Where; include?: Where } = {}) {
        const row = store.bookings.find((item) => matches(item, args.where));
        return row ? includeBooking(row, args.include) : null;
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
      async count(args: { where?: Where } = {}) {
        return store.bookings.filter((row) => matches(row, args.where)).length;
      },
      async deleteMany(args: { where?: Where } = {}) {
        const kept = store.bookings.filter((row) => !matches(row, args.where));
        const count = store.bookings.length - kept.length;
        store.bookings.splice(0, store.bookings.length, ...kept);
        return { count };
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
      async deleteMany(args: { where?: Where } = {}) {
        const kept = store.credits.filter((row) => !matches(row, args.where));
        const count = store.credits.length - kept.length;
        store.credits.splice(0, store.credits.length, ...kept);
        return { count };
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
      async count(args: { where?: Where } = {}) {
        return store.cancellations.filter((row) => matches(row, args.where))
          .length;
      },
      async deleteMany(args: { where?: Where } = {}) {
        const kept = store.cancellations.filter(
          (row) => !matches(row, args.where),
        );
        const count = store.cancellations.length - kept.length;
        store.cancellations.splice(0, store.cancellations.length, ...kept);
        return { count };
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
      async deleteMany(args: { where?: Where } = {}) {
        const kept = store.recurringSlots.filter(
          (row) => !matches(row, args.where),
        );
        const count = store.recurringSlots.length - kept.length;
        store.recurringSlots.splice(0, store.recurringSlots.length, ...kept);
        return { count };
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
    studioHour: {
      async findMany(args: { where?: Where; orderBy?: unknown } = {}) {
        return sortRows(
          store.studioHours.filter((row) => matches(row, args.where)),
          args.orderBy,
        );
      },
      async findUnique(args: { where: Where }) {
        return store.studioHours.find((row) => matches(row, args.where)) ?? null;
      },
      async create(args: {
        data: Omit<MemoryStudioHour, 'id'> & { id?: string };
      }) {
        const row: MemoryStudioHour = {
          id: args.data.id ?? nextId('hour'),
          name: args.data.name,
          weekdays: [...args.data.weekdays],
          startTime: args.data.startTime,
          endTime: args.data.endTime,
          capacity: args.data.capacity,
          classType: args.data.classType,
          trainerId: args.data.trainerId,
        };
        store.studioHours.push(row);
        return row;
      },
      async update(args: { where: Where; data: Partial<MemoryStudioHour> }) {
        const row = store.studioHours.find((item) => matches(item, args.where));
        if (!row) {
          throw new Error('StudioHour not found');
        }
        Object.assign(row, args.data);
        return row;
      },
      async delete(args: { where: Where }) {
        const index = store.studioHours.findIndex((row) => matches(row, args.where));
        if (index < 0) {
          throw new Error('StudioHour not found');
        }
        const [removed] = store.studioHours.splice(index, 1);
        if (!removed) {
          throw new Error('StudioHour not found');
        }
        return removed;
      },
    },
    classType: {
      async findMany(args: { orderBy?: unknown } = {}) {
        return sortRows(store.classTypes, args.orderBy);
      },
      async findUnique(args: { where: Where }) {
        return store.classTypes.find((row) => matches(row, args.where)) ?? null;
      },
      async create(args: {
        data: Omit<MemoryClassType, 'id'> & { id?: string };
      }) {
        const row: MemoryClassType = {
          id: args.data.id ?? nextId('classtype'),
          name: args.data.name,
        };
        store.classTypes.push(row);
        return row;
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
      async deleteMany(args: { where?: Where } = {}) {
        const kept: MemoryWaitlist[] = [];
        let count = 0;
        for (const row of store.waitlist) {
          if (matches(row, args.where)) {
            count += 1;
          } else {
            kept.push(row);
          }
        }
        store.waitlist.splice(0, store.waitlist.length, ...kept);
        return { count };
      },
    },
    studentTrainer: {
      async createMany(args: { data: MemoryStudentTrainer[] }) {
        store.studentTrainers.push(...args.data);
        return { count: args.data.length };
      },
      async deleteMany(args: { where?: Where } = {}) {
        const kept = store.studentTrainers.filter(
          (row) => !matches(row, args.where),
        );
        const count = store.studentTrainers.length - kept.length;
        store.studentTrainers.splice(
          0,
          store.studentTrainers.length,
          ...kept,
        );
        return { count };
      },
    },
    studentRegularSlot: {
      async create(args: {
        data: Omit<MemoryStudentRegularSlot, 'id'> & { id?: string };
      }) {
        const row: MemoryStudentRegularSlot = {
          id: args.data.id ?? nextId('regular'),
          studentId: args.data.studentId,
          studioHourId: args.data.studioHourId,
          weekday: args.data.weekday,
        };
        store.studentRegularSlots.push(row);
        return row;
      },
      async findMany(args: { where?: Where; include?: Where } = {}) {
        return store.studentRegularSlots
          .filter((row) => matches(row, args.where))
          .map((row) =>
            args.include?.studioHour
              ? {
                  ...row,
                  studioHour: store.studioHours.find(
                    (hour) => hour.id === row.studioHourId,
                  ),
                }
              : row,
          );
      },
      async deleteMany(args: { where?: Where } = {}) {
        const kept = store.studentRegularSlots.filter(
          (row) => !matches(row, args.where),
        );
        const count = store.studentRegularSlots.length - kept.length;
        store.studentRegularSlots.splice(
          0,
          store.studentRegularSlots.length,
          ...kept,
        );
        return { count };
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
        store.studioHours.splice(
          0,
          store.studioHours.length,
          ...snapshot.studioHours,
        );
        store.classTypes.splice(
          0,
          store.classTypes.length,
          ...snapshot.classTypes,
        );
        store.closures.splice(0, store.closures.length, ...snapshot.closures);
        store.waitlist.splice(0, store.waitlist.length, ...snapshot.waitlist);
        store.studentTrainers.splice(
          0,
          store.studentTrainers.length,
          ...snapshot.studentTrainers,
        );
        store.studentRegularSlots.splice(
          0,
          store.studentRegularSlots.length,
          ...snapshot.studentRegularSlots,
        );
        throw error;
      }
    },
  };

  return { prisma: delegate as unknown as PrismaService, store };
}

export function fixedClock(iso: string) {
  return { now: () => new Date(iso) };
}
