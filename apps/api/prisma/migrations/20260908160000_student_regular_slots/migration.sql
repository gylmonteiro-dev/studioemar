ALTER TABLE "User" ADD COLUMN "cpf" TEXT;

CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

CREATE TABLE "StudentRegularSlot" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studioHourId" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,

    CONSTRAINT "StudentRegularSlot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentRegularSlot_studentId_weekday_key" ON "StudentRegularSlot"("studentId", "weekday");

CREATE UNIQUE INDEX "StudentRegularSlot_studentId_studioHourId_weekday_key" ON "StudentRegularSlot"("studentId", "studioHourId", "weekday");

CREATE INDEX "StudentRegularSlot_studioHourId_idx" ON "StudentRegularSlot"("studioHourId");

ALTER TABLE "StudentRegularSlot" ADD CONSTRAINT "StudentRegularSlot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentRegularSlot" ADD CONSTRAINT "StudentRegularSlot_studioHourId_fkey" FOREIGN KEY ("studioHourId") REFERENCES "StudioHour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
