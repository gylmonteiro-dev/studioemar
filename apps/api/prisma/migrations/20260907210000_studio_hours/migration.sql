CREATE TABLE "StudioHour" (
    "id" TEXT NOT NULL,
    "weekdays" "Weekday"[] NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "classType" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,

    CONSTRAINT "StudioHour_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TimeSlot" ADD COLUMN "studioHourId" TEXT;

CREATE INDEX "TimeSlot_studioHourId_idx" ON "TimeSlot"("studioHourId");

ALTER TABLE "StudioHour"
ADD CONSTRAINT "StudioHour_trainerId_fkey"
FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TimeSlot"
ADD CONSTRAINT "TimeSlot_studioHourId_fkey"
FOREIGN KEY ("studioHourId") REFERENCES "StudioHour"("id") ON DELETE SET NULL ON UPDATE CASCADE;
