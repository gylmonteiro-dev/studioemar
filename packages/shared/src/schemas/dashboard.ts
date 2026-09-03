import { z } from 'zod';
import { weekdaySchema } from './enums.js';

export const occupancyMetricSchema = z.object({
  studentsToday: z.number().int().nonnegative(),
  occupancyPercent: z.number().min(0).max(100),
  freeSpots: z.number().int().nonnegative(),
  cancellations: z.number().int().nonnegative(),
  makeups: z.number().int().nonnegative(),
});
export type OccupancyMetric = z.infer<typeof occupancyMetricSchema>;

export const hourlyOccupancySchema = z.object({
  hour: z.string().regex(/^([01]\d|2[0-3]):00$/),
  occupancyPercent: z.number().min(0).max(100),
});
export type HourlyOccupancy = z.infer<typeof hourlyOccupancySchema>;

export const weekdayOccupancySchema = z.object({
  weekday: weekdaySchema,
  occupancyPercent: z.number().min(0).max(100),
});
export type WeekdayOccupancy = z.infer<typeof weekdayOccupancySchema>;

export const occupancyDashboardSchema = z.object({
  metrics: occupancyMetricSchema,
  byHour: z.array(hourlyOccupancySchema),
  byWeekday: z.array(weekdayOccupancySchema),
});
export type OccupancyDashboard = z.infer<typeof occupancyDashboardSchema>;
