CREATE TABLE "ClassType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ClassType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassType_name_key" ON "ClassType"("name");

UPDATE "StudioHour" SET "classType" = upper(btrim("classType"));
UPDATE "TimeSlot" SET "classType" = upper(btrim("classType"));

INSERT INTO "ClassType" ("id", "name")
SELECT 'classtype-' || md5(src.name), src.name
FROM (
    SELECT DISTINCT upper(btrim("classType")) AS name FROM "StudioHour"
    UNION
    SELECT DISTINCT upper(btrim("classType")) FROM "TimeSlot"
) src
WHERE src.name <> '';
