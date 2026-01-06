/*
  Warnings:

  - You are about to drop the column `shedId` on the `dispatch_records` table. All the data in the column will be lost.
  - You are about to drop the column `shedId` on the `mortality_records` table. All the data in the column will be lost.
  - Added the required column `farmId` to the `dispatch_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `farmId` to the `mortality_records` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "dispatch_records" DROP CONSTRAINT "dispatch_records_shedId_fkey";

-- DropForeignKey
ALTER TABLE "mortality_records" DROP CONSTRAINT "mortality_records_shedId_fkey";

-- DropIndex
DROP INDEX "dispatch_records_shedId_idx";

-- DropIndex
DROP INDEX "mortality_records_shedId_idx";

-- AlterTable
ALTER TABLE "dispatch_records" DROP COLUMN "shedId",
ADD COLUMN     "farmId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "mortality_records" DROP COLUMN "shedId",
ADD COLUMN     "farmId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "dispatch_records_farmId_idx" ON "dispatch_records"("farmId");

-- CreateIndex
CREATE INDEX "mortality_records_farmId_idx" ON "mortality_records"("farmId");

-- AddForeignKey
ALTER TABLE "mortality_records" ADD CONSTRAINT "mortality_records_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_records" ADD CONSTRAINT "dispatch_records_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
