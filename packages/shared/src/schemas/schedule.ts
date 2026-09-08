import { z } from 'zod';
import { normalizeClassTypeName } from '../rules/class-types.js';
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

const hourNameSchema = z
  .string()
  .trim()
  .min(1, 'Informe a identificação')
  .max(80);

export const classTypeNameSchema = z
  .string()
  .trim()
  .min(1, 'Informe o tipo da aula')
  .max(80)
  .transform((value) => normalizeClassTypeName(value));

export const classTypeSchema = z.object({
  id: idSchema,
  name: classTypeNameSchema,
});
export type ClassType = z.infer<typeof classTypeSchema>;

export const createClassTypeRequestSchema = z.object({
  name: classTypeNameSchema,
});
export type CreateClassTypeRequest = z.infer<typeof createClassTypeRequestSchema>;

export const timeSlotSchema = z.object({
  id: idSchema,
  name: hourNameSchema,
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
    name: hourNameSchema,
    weekdays: weekdaysFieldSchema,
    startTime: clockTimeSchema,
    endTime: clockTimeSchema,
    capacity: z.number().int().positive(),
    classType: classTypeNameSchema,
    trainerId: idSchema,
  })
  .refine((values) => values.endTime > values.startTime, {
    message: 'O término deve ser depois do início',
    path: ['endTime'],
  });
export type StudioHour = z.infer<typeof studioHourSchema>;

export const createStudioHourRequestSchema = z
  .object({
    name: hourNameSchema,
    weekdays: weekdaysFieldSchema,
    startTime: clockTimeSchema,
    endTime: clockTimeSchema,
    capacity: z.number().int().positive(),
    classType: classTypeNameSchema,
    trainerId: idSchema,
  })
  .refine((values) => values.endTime > values.startTime, {
    message: 'O término deve ser depois do início',
    path: ['endTime'],
  })
  .transform((values) => ({
    ...values,
    weekdays: uniqueSortedWeekdays(values.weekdays),
  }));
export type CreateStudioHourRequest = z.infer<
  typeof createStudioHourRequestSchema
>;

export const updateStudioHourRequestSchema = z
  .object({
    name: hourNameSchema.optional(),
    weekdays: weekdaysFieldSchema.optional(),
    startTime: clockTimeSchema.optional(),
    endTime: clockTimeSchema.optional(),
    capacity: z.number().int().positive().optional(),
    classType: classTypeNameSchema.optional(),
    trainerId: idSchema.optional(),
  })
  .transform((values) => ({
    ...values,
    ...(values.weekdays
      ? { weekdays: uniqueSortedWeekdays(values.weekdays) }
      : {}),
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
    name: hourNameSchema,
    date: isoDateSchema,
    startTime: clockTimeSchema,
    endTime: clockTimeSchema,
    capacity: z.number().int().positive(),
    classType: classTypeNameSchema,
    trainerId: idSchema,
  })
  .refine((values) => values.endTime > values.startTime, {
    message: 'O término deve ser depois do início',
    path: ['endTime'],
  });
export type CreateTimeSlotRequest = z.infer<typeof createTimeSlotRequestSchema>;

export const updateTimeSlotRequestSchema = z
  .object({
    name: hourNameSchema.optional(),
    date: isoDateSchema.optional(),
    startTime: clockTimeSchema.optional(),
    endTime: clockTimeSchema.optional(),
    capacity: z.number().int().positive().optional(),
    classType: classTypeNameSchema.optional(),
    trainerId: idSchema.optional(),
  });
export type UpdateTimeSlotRequest = z.infer<typeof updateTimeSlotRequestSchema>;
