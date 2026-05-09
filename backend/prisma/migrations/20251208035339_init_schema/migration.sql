-- CreateEnum
CREATE TYPE "AccommodationLevel" AS ENUM ('three', 'four', 'five', 'deluxe');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('in', 'out', 'none');

-- CreateEnum
CREATE TYPE "TransferVisibility" AS ENUM ('public', 'private');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Itinerary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "accommodationLevel" "AccommodationLevel" NOT NULL DEFAULT 'three',
    "totalPriceCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Day" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "accommodationLevel" "AccommodationLevel" NOT NULL,
    "destination" TEXT NOT NULL,
    "transferStatus" "TransferStatus" NOT NULL,
    "components" JSONB,
    "activityName" TEXT,
    "activityPriceCents" INTEGER NOT NULL DEFAULT 0,
    "accommodationPriceCents" INTEGER NOT NULL DEFAULT 0,
    "transferPriceCents" INTEGER NOT NULL DEFAULT 0,
    "destinationPriceCents" INTEGER NOT NULL DEFAULT 0,
    "totalPriceCents" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "surchargeCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationAccommodationPrice" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "accommodationLevel" "AccommodationLevel" NOT NULL,
    "basePriceCents" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DestinationAccommodationPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationTransferPrice" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "accommodationLevel" "AccommodationLevel" NOT NULL,
    "transferType" "TransferStatus" NOT NULL,
    "visibility" "TransferVisibility" NOT NULL,
    "addCents" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DestinationTransferPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationActivity" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DestinationActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationActivityPrice" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "accommodationLevel" "AccommodationLevel" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DestinationActivityPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_providerId_key" ON "User"("providerId");

-- CreateIndex
CREATE INDEX "Itinerary_userId_idx" ON "Itinerary"("userId");

-- CreateIndex
CREATE INDEX "Day_itineraryId_idx" ON "Day"("itineraryId");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_key" ON "Provider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_slug_key" ON "Provider"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");

-- CreateIndex
CREATE INDEX "Destination_providerId_idx" ON "Destination"("providerId");

-- CreateIndex
CREATE INDEX "DestinationAccommodationPrice_destinationId_accommodationLe_idx" ON "DestinationAccommodationPrice"("destinationId", "accommodationLevel", "validFrom", "validTo");

-- CreateIndex
CREATE INDEX "DestinationTransferPrice_destinationId_accommodationLevel_t_idx" ON "DestinationTransferPrice"("destinationId", "accommodationLevel", "transferType", "visibility", "validFrom", "validTo");

-- CreateIndex
CREATE INDEX "DestinationActivity_destinationId_idx" ON "DestinationActivity"("destinationId");

-- CreateIndex
CREATE INDEX "DestinationActivityPrice_activityId_accommodationLevel_vali_idx" ON "DestinationActivityPrice"("activityId", "accommodationLevel", "validFrom", "validTo");

-- AddForeignKey
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Day" ADD CONSTRAINT "Day_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationAccommodationPrice" ADD CONSTRAINT "DestinationAccommodationPrice_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationTransferPrice" ADD CONSTRAINT "DestinationTransferPrice_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationActivity" ADD CONSTRAINT "DestinationActivity_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationActivityPrice" ADD CONSTRAINT "DestinationActivityPrice_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "DestinationActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
