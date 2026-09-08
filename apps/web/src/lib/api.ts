import {
  authSessionSchema,
  bookingParticipantSchema,
  bookingSchema,
  cancellationSchema,
  classTypeSchema,
  creditSchema,
  healthSchema,
  occupancyDashboardSchema,
  planSchema,
  recoverAcceptedSchema,
  recurringSlotSchema,
  regularAvailabilitySlotSchema,
  studioClosureSchema,
  studioHourSchema,
  timeSlotSchema,
  userSchema,
  waitlistEntrySchema,
  type AddRecurringSlotRequest,
  type AuthSession,
  type Booking,
  type BookingParticipant,
  type Cancellation,
  type ClassType,
  type CreateClassTypeRequest,
  type CreatePlanRequest,
  type CreateStudentRequest,
  type CreateOperatorRequest,
  type CreateStudioClosureRequest,
  type CreateStudioHourRequest,
  type CreateTimeSlotRequest,
  type Credit,
  type FirstAccessRequest,
  type LoginRequest,
  type OccupancyDashboard,
  type Plan,
  type RecoverRequest,
  type RecurringSlot,
  type RegularAvailabilitySlot,
  type StudioClosure,
  type StudioHour,
  type TimeSlot,
  type User,
  type UpdatePlanRequest,
  type UpdateOperatorRequest,
  type UpdateStudioHourRequest,
  type UpdateStudentRequest,
  type UpdateTimeSlotRequest,
  type WaitlistEntry,
} from '@studioemar/shared';
import { z } from 'zod';
import { apiRequest } from './api-client';

const usersSchema = z.array(userSchema);
const bookingsSchema = z.array(bookingSchema);
const creditsSchema = z.array(creditSchema);
const timeSlotsSchema = z.array(timeSlotSchema);
const plansSchema = z.array(planSchema);
const classTypesSchema = z.array(classTypeSchema);
const participantsSchema = z.array(bookingParticipantSchema);
const waitlistSchema = z.array(waitlistEntrySchema);
const recurringSlotsSchema = z.array(recurringSlotSchema);
const studioHoursSchema = z.array(studioHourSchema);
const closuresSchema = z.array(studioClosureSchema);
const regularAvailabilitySchema = z.array(regularAvailabilitySlotSchema);

export function getServerNow(): Promise<Date> {
  return apiRequest('/health', { auth: false }).then((data) => {
    const health = healthSchema.parse(data);
    return new Date(health.now);
  });
}

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

export function listTimeSlots(range?: {
  from: string;
  to: string;
}): Promise<TimeSlot[]> {
  const query = range
    ? `?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`
    : '';
  return apiRequest(`/time-slots${query}`).then((data) =>
    timeSlotsSchema.parse(data),
  );
}

export function getTimeSlot(id: string): Promise<TimeSlot> {
  return apiRequest(`/time-slots/${id}`).then((data) =>
    timeSlotSchema.parse(data),
  );
}

export function createTimeSlot(body: CreateTimeSlotRequest): Promise<TimeSlot> {
  return apiRequest('/time-slots', { method: 'POST', body }).then((data) =>
    timeSlotSchema.parse(data),
  );
}

export function updateTimeSlot(
  id: string,
  body: UpdateTimeSlotRequest,
): Promise<TimeSlot> {
  return apiRequest(`/time-slots/${id}`, { method: 'PATCH', body }).then(
    (data) => timeSlotSchema.parse(data),
  );
}

export function deleteTimeSlot(id: string): Promise<void> {
  return apiRequest(`/time-slots/${id}`, { method: 'DELETE' });
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

export function listClassTypes(): Promise<ClassType[]> {
  return apiRequest('/class-types').then((data) => classTypesSchema.parse(data));
}

export function createClassType(
  body: CreateClassTypeRequest,
): Promise<ClassType> {
  return apiRequest('/class-types', { method: 'POST', body }).then((data) =>
    classTypeSchema.parse(data),
  );
}

export function listStudioHours(): Promise<StudioHour[]> {
  return apiRequest('/studio-hours').then((data) =>
    studioHoursSchema.parse(data),
  );
}

export function createStudioHour(
  body: CreateStudioHourRequest,
): Promise<StudioHour> {
  return apiRequest('/studio-hours', { method: 'POST', body }).then((data) =>
    studioHourSchema.parse(data),
  );
}

export function updateStudioHour(
  id: string,
  body: UpdateStudioHourRequest,
): Promise<StudioHour> {
  return apiRequest(`/studio-hours/${id}`, { method: 'PATCH', body }).then(
    (data) => studioHourSchema.parse(data),
  );
}

export function deleteStudioHour(id: string): Promise<void> {
  return apiRequest(`/studio-hours/${id}`, { method: 'DELETE' });
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

export function createPlan(body: CreatePlanRequest): Promise<Plan> {
  return apiRequest('/plans', { method: 'POST', body }).then((data) =>
    planSchema.parse(data),
  );
}

export function updatePlan(id: string, body: UpdatePlanRequest): Promise<Plan> {
  return apiRequest(`/plans/${id}`, { method: 'PATCH', body }).then((data) =>
    planSchema.parse(data),
  );
}

export function deletePlan(id: string): Promise<void> {
  return apiRequest(`/plans/${id}`, { method: 'DELETE' });
}

export function listStudents(): Promise<User[]> {
  return apiRequest('/students').then((data) => usersSchema.parse(data));
}

export function listRegularAvailability(
  planId: string,
): Promise<RegularAvailabilitySlot[]> {
  return apiRequest(
    `/students/regular-availability?planId=${encodeURIComponent(planId)}`,
  ).then((data) => regularAvailabilitySchema.parse(data));
}

export function createStudent(body: CreateStudentRequest): Promise<User> {
  return apiRequest('/students', { method: 'POST', body }).then((data) =>
    userSchema.parse(data),
  );
}

export function updateStudentTrainers(
  id: string,
  trainerIds: string[],
): Promise<User> {
  return apiRequest(`/students/${id}/trainers`, {
    method: 'PUT',
    body: { trainerIds },
  }).then((data) => userSchema.parse(data));
}

export function updateStudent(
  id: string,
  body: UpdateStudentRequest,
): Promise<User> {
  return apiRequest(`/students/${id}`, { method: 'PATCH', body }).then((data) =>
    userSchema.parse(data),
  );
}

export function listOperators(): Promise<User[]> {
  return apiRequest('/operators').then((data) => usersSchema.parse(data));
}

export function createOperator(body: CreateOperatorRequest): Promise<User> {
  return apiRequest('/operators', { method: 'POST', body }).then((data) =>
    userSchema.parse(data),
  );
}

export function updateOperator(
  id: string,
  body: UpdateOperatorRequest,
): Promise<User> {
  return apiRequest(`/operators/${id}`, { method: 'PATCH', body }).then(
    (data) => userSchema.parse(data),
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
