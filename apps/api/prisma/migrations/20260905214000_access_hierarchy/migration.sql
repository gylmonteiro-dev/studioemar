ALTER TYPE "UserRole" ADD VALUE 'SUPERADMIN';

ALTER TABLE "User"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "StudentTrainer" (
    "studentId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentTrainer_pkey" PRIMARY KEY ("studentId", "trainerId")
);

CREATE INDEX "StudentTrainer_trainerId_idx" ON "StudentTrainer"("trainerId");

ALTER TABLE "StudentTrainer"
ADD CONSTRAINT "StudentTrainer_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentTrainer"
ADD CONSTRAINT "StudentTrainer_trainerId_fkey"
FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
