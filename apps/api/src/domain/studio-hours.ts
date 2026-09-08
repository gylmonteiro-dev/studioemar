import type { Weekday } from '@studioemar/shared';
import {
  addCalendarDays,
  calendarDate,
  saoPauloDateTime,
  weekdayFromCalendarDate,
} from '../common/calendar-date';

export const STUDIO_HOUR_HORIZON_WEEKS = 12;

export const WEEKDAY_ORDER: readonly Weekday[] = [
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
  'SUN',
];

export function sortWeekdays(days: readonly Weekday[]): Weekday[] {
  const selected = new Set(days);
  return WEEKDAY_ORDER.filter((day) => selected.has(day));
}

export function intervalsOverlap(
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date,
): boolean {
  return leftStart < rightEnd && rightStart < leftEnd;
}

export function lookAheadEndDate(from: Date): string {
  return addCalendarDays(
    calendarDate(from),
    STUDIO_HOUR_HORIZON_WEEKS * 7 - 1,
  );
}

export function enumerateStudioHourOccurrences(input: {
  weekdays: readonly Weekday[];
  startTime: string;
  endTime: string;
  from: Date;
  startDate?: string;
  until?: string;
  weeks?: number;
}): Array<{ date: string; startsAt: Date; endsAt: Date }> {
  const wanted = new Set(input.weekdays);
  const fromDate = input.startDate ?? calendarDate(input.from);
  const until =
    input.until ??
    addCalendarDays(
      fromDate,
      (input.weeks ?? STUDIO_HOUR_HORIZON_WEEKS) * 7 - 1,
    );
  const occurrences: Array<{ date: string; startsAt: Date; endsAt: Date }> = [];

  for (
    let date = fromDate;
    date <= until;
    date = addCalendarDays(date, 1)
  ) {
    if (!wanted.has(weekdayFromCalendarDate(date))) {
      continue;
    }
    const startsAt = saoPauloDateTime(date, input.startTime);
    const endsAt = saoPauloDateTime(date, input.endTime);
    if (startsAt <= input.from) {
      continue;
    }
    occurrences.push({ date, startsAt, endsAt });
  }

  return occurrences;
}
