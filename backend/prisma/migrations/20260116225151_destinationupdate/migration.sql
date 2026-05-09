/*
  Warnings:

  - You are about to drop the column `packageDayOffset` on the `Day` table. All the data in the column will be lost.
  - You are about to drop the column `packageId` on the `Day` table. All the data in the column will be lost.
  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Package` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PackageItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Proposal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Day" DROP CONSTRAINT "Day_packageId_fkey";

-- DropForeignKey
ALTER TABLE "Package" DROP CONSTRAINT "Package_providerId_fkey";

-- DropForeignKey
ALTER TABLE "PackageItem" DROP CONSTRAINT "PackageItem_packageId_fkey";

-- DropForeignKey
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_itineraryId_fkey";

-- AlterTable
ALTER TABLE "Day" DROP COLUMN "packageDayOffset",
DROP COLUMN "packageId",
ADD COLUMN     "destinationId" TEXT;

-- DropTable
DROP TABLE "Client";

-- DropTable
DROP TABLE "Package";

-- DropTable
DROP TABLE "PackageItem";

-- DropTable
DROP TABLE "Proposal";

-- DropEnum
DROP TYPE "ProposalStatus";

-- CreateIndex
CREATE INDEX "Day_destinationId_idx" ON "Day"("destinationId");

-- AddForeignKey
ALTER TABLE "Day" ADD CONSTRAINT "Day_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;
