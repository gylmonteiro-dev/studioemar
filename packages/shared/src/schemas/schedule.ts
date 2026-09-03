import { z } from 'zod';
import { timeSlotStatusSchema, waitlistStatusSchema } from './enums.js';
import { idSchema, isoDateSchema, isoDateTimeSchema } from './ids.js';

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
