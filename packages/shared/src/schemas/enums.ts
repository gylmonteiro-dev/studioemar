import { z } from 'zod';

export const userRoleSchema = z.enum(['STUDENT', 'TRAINER', 'ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const weekdaySchema = z.enum([
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
  'SUN',
]);
export type Weekday = z.infer<typeof weekdaySchema>;

export const timeSlotStatusSchema = z.enum(['OPEN', 'FULL', 'CLOSED']);
export type TimeSlotStatus = z.infer<typeof timeSlotStatusSchema>;

export const bookingKindSchema = z.enum(['REGULAR', 'MAKEUP']);
export type BookingKind = z.infer<typeof bookingKindSchema>;

export const bookingStatusSchema = z.enum([
  'CONFIRMED',
  'CANCELLED',
  'NO_SHOW',
]);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const creditStatusSchema = z.enum(['AVAILABLE', 'USED', 'EXPIRED']);
export type CreditStatus = z.infer<typeof creditStatusSchema>;

export const creditSourceSchema = z.enum(['CANCELLATION', 'MANUAL']);
export type CreditSource = z.infer<typeof creditSourceSchema>;

export const waitlistStatusSchema = z.enum([
  'WAITING',
  'PROMOTED',
  'CANCELLED',
]);
export type WaitlistStatus = z.infer<typeof waitlistStatusSchema>;
