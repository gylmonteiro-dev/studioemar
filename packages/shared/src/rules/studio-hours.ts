import type { Weekday } from '../schemas/enums.js';

export type StudioHourOverlapInput = {
  id?: string;
  weekdays: readonly Weekday[];
  startTime: string;
  endTime: string;
};

export function clockIntervalsOverlap(
  leftStart: string,
  leftEnd: string,
  rightStart: string,
  rightEnd: string,
): boolean {
  return leftStart < rightEnd && rightStart < leftEnd;
}

export function studioHoursCoincide(
  left: StudioHourOverlapInput,
  right: StudioHourOverlapInput,
): boolean {
  const sharesDay = left.weekdays.some((day) => right.weekdays.includes(day));
  if (!sharesDay) {
    return false;
  }
  return clockIntervalsOverlap(
    left.startTime,
    left.endTime,
    right.startTime,
    right.endTime,
  );
}

export function coincidingStudioHours<T extends StudioHourOverlapInput>(
  candidate: StudioHourOverlapInput,
  existing: readonly T[],
): T[] {
  return existing.filter(
    (hour) => hour.id !== candidate.id && studioHoursCoincide(candidate, hour),
  );
}
