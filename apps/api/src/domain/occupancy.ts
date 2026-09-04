import {
  occupancyDashboardSchema,
  type OccupancyDashboard,
  type Weekday,
} from '@studioemar/shared';
import { calendarDate } from '../common/calendar-date';

const TIME_ZONE = 'America/Sao_Paulo';

const WEEKDAY_BY_INDEX: Weekday[] = [
  'SUN',
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
];

const WEEKDAYS_CHART: Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

export type OccupancySlot = {
  id: string;
  startsAt: Date;
  capacity: number;
  enrolledCount: number;
};

export type OccupancyBooking = {
  studentId: string;
  timeSlotId: string;
  kind: 'REGULAR' | 'MAKEUP';
  status: 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
};

function weekdayOf(startsAt: Date): Weekday {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'short',
  }).format(startsAt);
  const index = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    weekday,
  );
  return WEEKDAY_BY_INDEX[index] ?? 'MON';
}

function hourBucket(startsAt: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(startsAt);
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  return `${hour}:00`;
}

function percent(enrolledCount: number, capacity: number): number {
  return capacity === 0 ? 0 : Math.round((enrolledCount / capacity) * 100);
}

export function computeOccupancy(input: {
  now: Date;
  timeSlots: OccupancySlot[];
  bookings: OccupancyBooking[];
  cancellationCount: number;
}): OccupancyDashboard {
  const today = calendarDate(input.now);
  const slotsById = new Map(input.timeSlots.map((slot) => [slot.id, slot]));
  const todaySlots = input.timeSlots.filter(
    (slot) => calendarDate(slot.startsAt) === today,
  );
  const todayStudentIds = new Set(
    input.bookings
      .filter((booking) => {
        if (booking.status !== 'CONFIRMED') {
          return false;
        }
        const slot = slotsById.get(booking.timeSlotId);
        return slot ? calendarDate(slot.startsAt) === today : false;
      })
      .map((booking) => booking.studentId),
  );
  const capacity = todaySlots.reduce((sum, slot) => sum + slot.capacity, 0);
  const enrolled = todaySlots.reduce(
    (sum, slot) => sum + slot.enrolledCount,
    0,
  );

  const hourMap = new Map<string, { enrolled: number; capacity: number }>();
  const weekdayMap = new Map<Weekday, { enrolled: number; capacity: number }>();

  input.timeSlots.forEach((slot) => {
    const hour = hourBucket(slot.startsAt);
    const weekday = weekdayOf(slot.startsAt);
    const hourEntry = hourMap.get(hour) ?? { enrolled: 0, capacity: 0 };
    hourEntry.enrolled += slot.enrolledCount;
    hourEntry.capacity += slot.capacity;
    hourMap.set(hour, hourEntry);
    const weekdayEntry = weekdayMap.get(weekday) ?? {
      enrolled: 0,
      capacity: 0,
    };
    weekdayEntry.enrolled += slot.enrolledCount;
    weekdayEntry.capacity += slot.capacity;
    weekdayMap.set(weekday, weekdayEntry);
  });

  return occupancyDashboardSchema.parse({
    metrics: {
      studentsToday: todayStudentIds.size,
      occupancyPercent: percent(enrolled, capacity),
      freeSpots: Math.max(0, capacity - enrolled),
      cancellations: input.cancellationCount,
      makeups: input.bookings.filter(
        (booking) =>
          booking.kind === 'MAKEUP' && booking.status === 'CONFIRMED',
      ).length,
    },
    byHour: [...hourMap.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([hour, value]) => ({
        hour,
        occupancyPercent: percent(value.enrolled, value.capacity),
      })),
    byWeekday: WEEKDAYS_CHART.map((weekday) => {
      const value = weekdayMap.get(weekday) ?? { enrolled: 0, capacity: 0 };
      return {
        weekday,
        occupancyPercent: percent(value.enrolled, value.capacity),
      };
    }),
  });
}
