/*
  Warnings:

  - You are about to drop the column `shedId` on the `productions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[farmId,date]` on the table `productions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `farmId` to the `productions` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add farmId column as nullable first
ALTER TABLE "productions" ADD COLUMN "farmId" TEXT;

-- Step 2: Populate farmId based on existing shedId relationships
UPDATE "productions" 
SET "farmId" = (
  SELECT "farms"."id" 
  FROM "sheds" 
  JOIN "farms" ON "sheds"."farmId" = "farms"."id" 
  WHERE "sheds"."id" = "productions"."shedId"
);

-- Step 3: Make farmId NOT NULL now that it's populated
ALTER TABLE "productions" ALTER COLUMN "farmId" SET NOT NULL;

-- Step 4: Drop the old foreign key and indexes
ALTER TABLE "productions" DROP CONSTRAINT "productions_shedId_fkey";
DROP INDEX "productions_shedId_date_key";
DROP INDEX "productions_shedId_idx";

-- Step 5: Drop the shedId column
ALTER TABLE "productions" DROP COLUMN "shedId";

-- Step 6: Create new indexes and constraints
CREATE INDEX "productions_farmId_idx" ON "productions"("farmId");
CREATE UNIQUE INDEX "productions_farmId_date_key" ON "productions"("farmId", "date");

-- Step 7: Add the new foreign key
ALTER TABLE "productions" ADD CONSTRAINT "productions_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
