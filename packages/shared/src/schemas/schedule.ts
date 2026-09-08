import { z } from 'zod';
import {
  timeSlotStatusSchema,
  waitlistStatusSchema,
  weekdaySchema,
  type Weekday,
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

const weekdaysFieldSchema = z
  .array(weekdaySchema)
  .min(1, 'Escolha pelo menos um dia');

function uniqueSortedWeekdays(days: Weekday[]) {
  return [...new Set(days)].sort((left, right) => {
    const order: Weekday[] = [
      'MON',
      'TUE',
      'WED',
      'THU',
      'FRI',
      'SAT',
      'SUN',
    ];
    return order.indexOf(left) - order.indexOf(right);
  });
}

export const studioHourSchema = z
  .object({
    id: idSchema,
    weekdays: weekdaysFieldSchema,
    startTime: clockTimeSchema,
    endTime: clockTimeSchema,
    capacity: z.number().int().positive(),
    classType: z.string().min(1),
    trainerId: idSchema,
  })
  .refine((values) => values.endTime > values.startTime, {
    message: 'O término deve ser depois do início',
    path: ['endTime'],
  });
export type StudioHour = z.infer<typeof studioHourSchema>;

export const createStudioHourRequestSchema = z
  .object({
    weekdays: weekdaysFieldSchema,
    startTime: clockTimeSchema,
    endTime: clockTimeSchema,
    capacity: z.number().int().positive(),
    classType: z.string().min(1),
    trainerId: idSchema,
  })
  .refine((values) => values.endTime > values.startTime, {
    message: 'O término deve ser depois do início',
    path: ['endTime'],
  })
  .transform((values) => ({
    ...values,
    weekdays: uniqueSortedWeekdays(values.weekdays),
    classType: values.classType.trim(),
  }));
export type CreateStudioHourRequest = z.infer<
  typeof createStudioHourRequestSchema
>;

export const updateStudioHourRequestSchema = z
  .object({
    weekdays: weekdaysFieldSchema.optional(),
    startTime: clockTimeSchema.optional(),
    endTime: clockTimeSchema.optional(),
    capacity: z.number().int().positive().optional(),
    classType: z.string().min(1).optional(),
    trainerId: idSchema.optional(),
  })
  .transform((values) => ({
    ...values,
    ...(values.weekdays
      ? { weekdays: uniqueSortedWeekdays(values.weekdays) }
      : {}),
    ...(values.classType ? { classType: values.classType.trim() } : {}),
  }))
  .refine(
    (values) => {
      const start = values.startTime;
      const end = values.endTime;
      if (start && end) {
        return end > start;
      }
      return true;
    },
    {
      message: 'O término deve ser depois do início',
      path: ['endTime'],
    },
  );
export type UpdateStudioHourRequest = z.infer<
  typeof updateStudioHourRequestSchema
>;

export const createTimeSlotRequestSchema = z
  .object({
    date: isoDateSchema,
    startTime: clockTimeSchema,
    endTime: clockTimeSchema,
    capacity: z.number().int().positive(),
    classType: z.string().min(1),
    trainerId: idSchema,
  })
  .refine((values) => values.endTime > values.startTime, {
    message: 'O término deve ser depois do início',
    path: ['endTime'],
  })
  .transform((values) => ({
    ...values,
    classType: values.classType.trim(),
  }));
export type CreateTimeSlotRequest = z.infer<typeof createTimeSlotRequestSchema>;

export const updateTimeSlotRequestSchema = z
  .object({
    date: isoDateSchema.optional(),
    startTime: clockTimeSchema.optional(),
    endTime: clockTimeSchema.optional(),
    capacity: z.number().int().positive().optional(),
    classType: z.string().min(1).optional(),
    trainerId: idSchema.optional(),
  })
  .transform((values) => ({
    ...values,
    ...(values.classType ? { classType: values.classType.trim() } : {}),
  }));
export type UpdateTimeSlotRequest = z.infer<typeof updateTimeSlotRequestSchema>;
