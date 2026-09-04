import { z } from 'zod';
import {
  timeSlotStatusSchema,
  waitlistStatusSchema,
  weekdaySchema,
} from './enums.js';
import {
  clockTimeSchema,
  idSchema,
  isoDateSchema,
  isoDateTimeSchema,
} from './ids.js';

export const timeSlotSchema = z.object({
  id: idSchema,
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema,
  capacity: z.number().int().positive(),
  enrolledCount: z.number().int().nonnegative(),
  status: timeSlotStatusSchema,
  classType: z.string().min(1),
  trainerId: idSchema,
});
export type TimeSlot = z.infer<typeof timeSlotSchema>;

export const studioClosureSchema = z.object({
  id: idSchema,
  startsOn: isoDateSchema,
  endsOn: isoDateSchema,
  reason: z.string().min(1),
  createdByUserId: idSchema,
  grantsCredit: z.boolean().default(false),
});
export type StudioClosure = z.infer<typeof studioClosureSchema>;

export const waitlistEntrySchema = z.object({
  id: idSchema,
  timeSlotId: idSchema,
  studentId: idSchema,
  position: z.number().int().positive(),
  enqueuedAt: isoDateTimeSchema,
  status: waitlistStatusSchema,
});
export type WaitlistEntry = z.infer<typeof waitlistEntrySchema>;

export const createStudioClosureRequestSchema = z
  .object({
    startsOn: isoDateSchema,
    endsOn: isoDateSchema,
    reason: z.string().min(1),
    grantsCredit: z.boolean().default(false),
  })
  .refine((values) => values.endsOn >= values.startsOn, {
    message: 'A data final não pode ser anterior ao início',
    path: ['endsOn'],
  });
export type CreateStudioClosureRequest = z.infer<
  typeof createStudioClosureRequestSchema
>;

export const addRecurringSlotRequestSchema = z.object({
  planId: idSchema,
  weekday: weekdaySchema,
  time: clockTimeSchema,
});
export type AddRecurringSlotRequest = z.infer<
  typeof addRecurringSlotRequestSchema
>;
