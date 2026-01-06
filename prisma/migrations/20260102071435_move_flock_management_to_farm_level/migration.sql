/*
  Warnings:

  - You are about to drop the column `shedId` on the `flock_management` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[farmId,date]` on the table `flock_management` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `farmId` to the `flock_management` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "flock_management" DROP CONSTRAINT "flock_management_shedId_fkey";

-- DropIndex
DROP INDEX "flock_management_shedId_date_key";

-- DropIndex
DROP INDEX "flock_management_shedId_idx";

-- AlterTable
ALTER TABLE "flock_management" DROP COLUMN "shedId",
ADD COLUMN     "farmId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "flock_management_farmId_idx" ON "flock_management"("farmId");

-- CreateIndex
CREATE UNIQUE INDEX "flock_management_farmId_date_key" ON "flock_management"("farmId", "date");

-- AddForeignKey
ALTER TABLE "flock_management" ADD CONSTRAINT "flock_management_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
