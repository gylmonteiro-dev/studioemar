-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_studioHourId_startsAt_key" ON "TimeSlot"("studioHourId", "startsAt");
