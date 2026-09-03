import {
  CANCELLATION_CREDIT_DEADLINE_HOURS,
  CREDIT_VALIDITY_DAYS,
} from '../constants.js';

export function isCancellationEligibleForCredit(
  now: Date,
  classStartsAt: Date,
): boolean {
  const deadlineMs = CANCELLATION_CREDIT_DEADLINE_HOURS * 60 * 60 * 1000;
  return classStartsAt.getTime() - now.getTime() >= deadlineMs;
}

export function creditExpiresAt(generatedAt: Date): Date {
  const expires = new Date(generatedAt.getTime());
  expires.setUTCDate(expires.getUTCDate() + CREDIT_VALIDITY_DAYS);
  return expires;
}
