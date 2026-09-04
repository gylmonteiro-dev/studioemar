-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TRAINER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "TimeSlotStatus" AS ENUM ('OPEN', 'FULL', 'CLOSED');

-- CreateEnum
CREATE TYPE "BookingKind" AS ENUM ('REGULAR', 'MAKEUP');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "CreditStatus" AS ENUM ('AVAILABLE', 'USED', 'EXPIRED', 'ANNULLED');

-- CreateEnum
CREATE TYPE "CreditSource" AS ENUM ('CANCELLATION', 'TRAINER_CANCELLATION', 'CLOSURE_COMPENSATION');

-- CreateEnum
CREATE TYPE "CancelledBy" AS ENUM ('STUDENT', 'TRAINER');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'PROMOTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weeklyFrequency" INTEGER NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "planId" TEXT,
    "mustSetPassword" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringSlot" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "time" TEXT NOT NULL,

    CONSTRAINT "RecurringSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "enrolledCount" INTEGER NOT NULL,
    "status" "TimeSlotStatus" NOT NULL,
    "classType" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioClosure" (
    "id" TEXT NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "grantsCredit" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StudioClosure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "enqueuedAt" TIMESTAMP(3) NOT NULL,
    "status" "WaitlistStatus" NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "kind" "BookingKind" NOT NULL,
    "status" "BookingStatus" NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cancellation" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3) NOT NULL,
    "cancelledBy" "CancelledBy" NOT NULL,
    "generatedCredit" BOOLEAN NOT NULL,
    "creditId" TEXT,

    CONSTRAINT "Cancellation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "source" "CreditSource" NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "originBookingId" TEXT,
    "originClosureId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "CreditStatus" NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedBookingId" TEXT,
    "annulledAt" TIMESTAMP(3),
    "annulledByUserId" TEXT,

    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringSlot_planId_weekday_time_key" ON "RecurringSlot"("planId", "weekday", "time");

-- CreateIndex
CREATE INDEX "TimeSlot_startsAt_idx" ON "TimeSlot"("startsAt");

-- CreateIndex
CREATE INDEX "TimeSlot_trainerId_idx" ON "TimeSlot"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_timeSlotId_studentId_key" ON "WaitlistEntry"("timeSlotId", "studentId");

-- CreateIndex
CREATE INDEX "Booking_studentId_idx" ON "Booking"("studentId");

-- CreateIndex
CREATE INDEX "Booking_timeSlotId_idx" ON "Booking"("timeSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "Cancellation_bookingId_key" ON "Cancellation"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Cancellation_creditId_key" ON "Cancellation"("creditId");

-- CreateIndex
CREATE INDEX "Credit_studentId_idx" ON "Credit"("studentId");

-- CreateIndex
CREATE INDEX "Credit_status_idx" ON "Credit"("status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringSlot" ADD CONSTRAINT "RecurringSlot_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioClosure" ADD CONSTRAINT "StudioClosure_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "Credit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_originBookingId_fkey" FOREIGN KEY ("originBookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_originClosureId_fkey" FOREIGN KEY ("originClosureId") REFERENCES "StudioClosure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_usedBookingId_fkey" FOREIGN KEY ("usedBookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_annulledByUserId_fkey" FOREIGN KEY ("annulledByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
