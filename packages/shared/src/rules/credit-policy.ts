import { normalizeClockTime } from '../clock-time.js';
import {
  CANCELLATION_CREDIT_DEADLINE_HOURS,
  CREDIT_VALIDITY_DAYS,
} from '../constants.js';
import type { Weekday } from '../schemas/enums.js';

export type RegularTrainingMatch = {
  weekday: Weekday;
  startTime: string;
};

export function isCancellationEligibleForCredit(
  now: Date,
  classStartsAt: Date,
): boolean {
  const deadlineMs = CANCELLATION_CREDIT_DEADLINE_HOURS * 60 * 60 * 1000;
  return classStartsAt.getTime() - now.getTime() >= deadlineMs;
}

export function creditExpiresAt(classStartsAt: Date): Date {
  const expires = new Date(classStartsAt.getTime());
  expires.setUTCDate(expires.getUTCDate() + CREDIT_VALIDITY_DAYS);
  return expires;
}

export function isOwnRegularTrainingSlot(
  weekday: Weekday,
  startTime: string,
  regularSlots: readonly RegularTrainingMatch[],
): boolean {
  const time = normalizeClockTime(startTime);
  if (!time) {
    return false;
  }
  return regularSlots.some(
    (slot) =>
      slot.weekday === weekday && normalizeClockTime(slot.startTime) === time,
  );
}
