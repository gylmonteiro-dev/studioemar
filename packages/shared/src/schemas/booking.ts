import { z } from 'zod';
import {
  bookingKindSchema,
  bookingStatusSchema,
  cancelledBySchema,
} from './enums.js';
import { idSchema, isoDateTimeSchema } from './ids.js';

export const bookingSchema = z.object({
  id: idSchema,
  studentId: idSchema,
  timeSlotId: idSchema,
  kind: bookingKindSchema,
  status: bookingStatusSchema,
});
export type Booking = z.infer<typeof bookingSchema>;

export const cancellationSchema = z.object({
  id: idSchema,
  bookingId: idSchema,
  cancelledAt: isoDateTimeSchema,
  cancelledBy: cancelledBySchema,
  generatedCredit: z.boolean(),
  creditId: idSchema.optional(),
});
export type Cancellation = z.infer<typeof cancellationSchema>;
