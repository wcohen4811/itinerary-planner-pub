-- CreateEnum
CREATE TYPE "PricingLineItemKind" AS ENUM ('hotel', 'activity', 'custom', 'general');

-- CreateTable
CREATE TABLE "PricingLineItemTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "PricingLineItemKind" NOT NULL DEFAULT 'custom',
    "defaultAmountCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingLineItemTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryPricingItem" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "kind" "PricingLineItemKind" NOT NULL DEFAULT 'general',
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItineraryPricingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayPricingItem" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "kind" "PricingLineItemKind" NOT NULL DEFAULT 'custom',
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayPricingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PricingLineItemTemplate_kind_idx" ON "PricingLineItemTemplate"("kind");

-- CreateIndex
CREATE INDEX "ItineraryPricingItem_itineraryId_idx" ON "ItineraryPricingItem"("itineraryId");

-- CreateIndex
CREATE INDEX "ItineraryPricingItem_templateId_idx" ON "ItineraryPricingItem"("templateId");

-- CreateIndex
CREATE INDEX "DayPricingItem_dayId_idx" ON "DayPricingItem"("dayId");

-- CreateIndex
CREATE INDEX "DayPricingItem_templateId_idx" ON "DayPricingItem"("templateId");

-- AddForeignKey
ALTER TABLE "ItineraryPricingItem" ADD CONSTRAINT "ItineraryPricingItem_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryPricingItem" ADD CONSTRAINT "ItineraryPricingItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PricingLineItemTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayPricingItem" ADD CONSTRAINT "DayPricingItem_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayPricingItem" ADD CONSTRAINT "DayPricingItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PricingLineItemTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
