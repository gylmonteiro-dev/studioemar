import {
  authSessionSchema,
  bookingParticipantSchema,
  bookingSchema,
  cancellationSchema,
  creditSchema,
  occupancyDashboardSchema,
  planSchema,
  recoverAcceptedSchema,
  recurringSlotSchema,
  studioClosureSchema,
  timeSlotSchema,
  userSchema,
  waitlistEntrySchema,
  type AddRecurringSlotRequest,
  type AuthSession,
  type Booking,
  type BookingParticipant,
  type Cancellation,
  type CreateStudentRequest,
  type CreateStudioClosureRequest,
  type Credit,
  type FirstAccessRequest,
  type LoginRequest,
  type OccupancyDashboard,
  type Plan,
  type RecoverRequest,
  type RecurringSlot,
  type StudioClosure,
  type TimeSlot,
  type User,
  type WaitlistEntry,
} from '@studioemar/shared';
import { z } from 'zod';
import { apiRequest } from './api-client';

const usersSchema = z.array(userSchema);
const bookingsSchema = z.array(bookingSchema);
const creditsSchema = z.array(creditSchema);
const timeSlotsSchema = z.array(timeSlotSchema);
const plansSchema = z.array(planSchema);
const participantsSchema = z.array(bookingParticipantSchema);
const waitlistSchema = z.array(waitlistEntrySchema);
const recurringSlotsSchema = z.array(recurringSlotSchema);
const closuresSchema = z.array(studioClosureSchema);

export function login(body: LoginRequest): Promise<AuthSession> {
  return apiRequest('/auth/login', { method: 'POST', body, auth: false }).then(
    (data) => authSessionSchema.parse(data),
  );
}

export function firstAccess(body: FirstAccessRequest): Promise<AuthSession> {
  return apiRequest('/auth/first-access', {
    method: 'POST',
    body,
    auth: false,
  }).then((data) => authSessionSchema.parse(data));
}

export function recoverPassword(
  body: RecoverRequest,
): Promise<{ ok: true }> {
  return apiRequest('/auth/recover', {
    method: 'POST',
    body,
    auth: false,
  }).then((data) => recoverAcceptedSchema.parse(data));
}

export function getMe(): Promise<User> {
  return apiRequest('/me').then((data) => userSchema.parse(data));
}

export function listMyBookings(): Promise<Booking[]> {
  return apiRequest('/me/bookings').then((data) => bookingsSchema.parse(data));
}

export function cancelBooking(id: string): Promise<Cancellation> {
  return apiRequest(`/bookings/${id}/cancellations`, { method: 'POST' }).then(
    (data) => cancellationSchema.parse(data),
  );
}

export function listMyCredits(): Promise<Credit[]> {
  return apiRequest('/me/credits').then((data) => creditsSchema.parse(data));
}

export function listCredits(): Promise<Credit[]> {
  return apiRequest('/credits').then((data) => creditsSchema.parse(data));
}

export function redeemCredit(
  creditId: string,
  timeSlotId: string,
): Promise<Booking> {
  return apiRequest(`/credits/${creditId}/redemptions`, {
    method: 'POST',
    body: { timeSlotId },
  }).then((data) => bookingSchema.parse(data));
}

export function annulCredit(creditId: string): Promise<Credit> {
  return apiRequest(`/credits/${creditId}/annulments`, { method: 'POST' }).then(
    (data) => creditSchema.parse(data),
  );
}

export function listTimeSlots(): Promise<TimeSlot[]> {
  return apiRequest('/time-slots').then((data) => timeSlotsSchema.parse(data));
}

export function getTimeSlot(id: string): Promise<TimeSlot> {
  return apiRequest(`/time-slots/${id}`).then((data) =>
    timeSlotSchema.parse(data),
  );
}

export function listSlotBookings(id: string): Promise<BookingParticipant[]> {
  return apiRequest(`/time-slots/${id}/bookings`).then((data) =>
    participantsSchema.parse(data),
  );
}

export function listWaitlist(id: string): Promise<WaitlistEntry[]> {
  return apiRequest(`/time-slots/${id}/waitlist`).then((data) =>
    waitlistSchema.parse(data),
  );
}

export function listRecurringSlots(): Promise<RecurringSlot[]> {
  return apiRequest('/recurring-slots').then((data) =>
    recurringSlotsSchema.parse(data),
  );
}

export function addRecurringSlot(
  body: AddRecurringSlotRequest,
): Promise<RecurringSlot> {
  return apiRequest('/recurring-slots', { method: 'POST', body }).then((data) =>
    recurringSlotSchema.parse(data),
  );
}

export function removeRecurringSlot(id: string): Promise<void> {
  return apiRequest(`/recurring-slots/${id}`, { method: 'DELETE' });
}

export function listClosures(): Promise<StudioClosure[]> {
  return apiRequest('/closures').then((data) => closuresSchema.parse(data));
}

export function createClosure(
  body: CreateStudioClosureRequest,
): Promise<StudioClosure> {
  return apiRequest('/closures', { method: 'POST', body }).then((data) =>
    studioClosureSchema.parse(data),
  );
}

export function listPlans(): Promise<Plan[]> {
  return apiRequest('/plans').then((data) => plansSchema.parse(data));
}

export function listStudents(): Promise<User[]> {
  return apiRequest('/students').then((data) => usersSchema.parse(data));
}

export function createStudent(body: CreateStudentRequest): Promise<User> {
  return apiRequest('/students', { method: 'POST', body }).then((data) =>
    userSchema.parse(data),
  );
}

export function getStudent(id: string): Promise<User> {
  return apiRequest(`/students/${id}`).then((data) => userSchema.parse(data));
}

export function listStudentBookings(id: string): Promise<Booking[]> {
  return apiRequest(`/students/${id}/bookings`).then((data) =>
    bookingsSchema.parse(data),
  );
}

export function listStudentCredits(id: string): Promise<Credit[]> {
  return apiRequest(`/students/${id}/credits`).then((data) =>
    creditsSchema.parse(data),
  );
}

export function getDashboard(): Promise<OccupancyDashboard> {
  return apiRequest('/dashboard').then((data) =>
    occupancyDashboardSchema.parse(data),
  );
}
