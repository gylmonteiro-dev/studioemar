ALTER TABLE "Plan" ADD COLUMN "sessionMinutes" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "Plan" ADD COLUMN "price" DECIMAL(10,2);

UPDATE "Plan" SET "name" = upper(btrim("name"));

CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");
