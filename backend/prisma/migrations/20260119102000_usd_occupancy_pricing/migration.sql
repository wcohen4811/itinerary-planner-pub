-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "Occupancy" AS ENUM ('single', 'double', 'triple');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- De-duplicate template names before adding unique constraint
WITH ranked AS (
  SELECT id, name,
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY "createdAt", id) AS rn
  FROM "PricingLineItemTemplate"
)
UPDATE "PricingLineItemTemplate" t
SET name = t.name || ' (' || ranked.rn || ')'
FROM ranked
WHERE t.id = ranked.id AND ranked.rn > 1;

-- Rename cents columns to USD and scale down
ALTER TABLE "Itinerary" RENAME COLUMN "totalPriceCents" TO "totalPriceUsd";
UPDATE "Itinerary" SET "totalPriceUsd" = FLOOR("totalPriceUsd" / 100);

ALTER TABLE "Day" RENAME COLUMN "activityPriceCents" TO "activityPriceUsd";
ALTER TABLE "Day" RENAME COLUMN "accommodationPriceCents" TO "accommodationPriceUsd";
ALTER TABLE "Day" RENAME COLUMN "transferPriceCents" TO "transferPriceUsd";
ALTER TABLE "Day" RENAME COLUMN "destinationPriceCents" TO "destinationPriceUsd";
ALTER TABLE "Day" RENAME COLUMN "totalPriceCents" TO "totalPriceUsd";
UPDATE "Day"
SET "activityPriceUsd" = FLOOR("activityPriceUsd" / 100),
    "accommodationPriceUsd" = FLOOR("accommodationPriceUsd" / 100),
    "transferPriceUsd" = FLOOR("transferPriceUsd" / 100),
    "destinationPriceUsd" = FLOOR("destinationPriceUsd" / 100),
    "totalPriceUsd" = FLOOR("totalPriceUsd" / 100);

ALTER TABLE "DayPricing" RENAME COLUMN "activityPriceCents" TO "activityPriceUsd";
ALTER TABLE "DayPricing" RENAME COLUMN "transferPriceCents" TO "transferPriceUsd";
ALTER TABLE "DayPricing" RENAME COLUMN "accommodationPriceCents" TO "accommodationPriceUsd";
UPDATE "DayPricing"
SET "activityPriceUsd" = FLOOR("activityPriceUsd" / 100),
    "transferPriceUsd" = FLOOR("transferPriceUsd" / 100),
    "accommodationPriceUsd" = FLOOR("accommodationPriceUsd" / 100);

ALTER TABLE "Provider" RENAME COLUMN "surchargeCents" TO "surchargeUsd";
UPDATE "Provider"
SET "surchargeUsd" = CASE
  WHEN "surchargeUsd" IS NULL THEN NULL
  ELSE FLOOR("surchargeUsd" / 100)
END;

ALTER TABLE "DestinationAccommodationPrice" RENAME COLUMN "basePriceCents" TO "basePriceUsd";
UPDATE "DestinationAccommodationPrice" SET "basePriceUsd" = FLOOR("basePriceUsd" / 100);

ALTER TABLE "DestinationTransferPrice" RENAME COLUMN "addCents" TO "addUsd";
UPDATE "DestinationTransferPrice" SET "addUsd" = FLOOR("addUsd" / 100);

ALTER TABLE "DestinationActivityPrice" RENAME COLUMN "amountCents" TO "amountUsd";
UPDATE "DestinationActivityPrice" SET "amountUsd" = FLOOR("amountUsd" / 100);

ALTER TABLE "PricingLineItemTemplate" RENAME COLUMN "defaultAmountCents" TO "defaultAmountUsd";
UPDATE "PricingLineItemTemplate" SET "defaultAmountUsd" = FLOOR("defaultAmountUsd" / 100);

ALTER TABLE "ItineraryPricingItem" RENAME COLUMN "amountCents" TO "amountUsd";
UPDATE "ItineraryPricingItem" SET "amountUsd" = FLOOR("amountUsd" / 100);

ALTER TABLE "DayPricingItem" RENAME COLUMN "amountCents" TO "amountUsd";
UPDATE "DayPricingItem" SET "amountUsd" = FLOOR("amountUsd" / 100);

-- Add occupancy + level columns to pricing items
ALTER TABLE "ItineraryPricingItem"
  ADD COLUMN "accommodationLevel" "AccommodationLevel" NOT NULL DEFAULT 'three',
  ADD COLUMN "occupancy" "Occupancy" NOT NULL DEFAULT 'double';

UPDATE "ItineraryPricingItem" ip
SET "accommodationLevel" = it."accommodationLevel"
FROM "Itinerary" it
WHERE ip."itineraryId" = it."id";

ALTER TABLE "DayPricingItem"
  ADD COLUMN "accommodationLevel" "AccommodationLevel" NOT NULL DEFAULT 'three',
  ADD COLUMN "occupancy" "Occupancy" NOT NULL DEFAULT 'double',
  ADD COLUMN "isRemoved" BOOLEAN NOT NULL DEFAULT false;

UPDATE "DayPricingItem" di
SET "accommodationLevel" = d."accommodationLevel"
FROM "Day" d
WHERE di."dayId" = d."id";

-- Template price overrides table
CREATE TABLE "PricingLineItemTemplatePrice" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "accommodationLevel" "AccommodationLevel" NOT NULL,
  "occupancy" "Occupancy" NOT NULL,
  "amountUsd" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PricingLineItemTemplatePrice_pkey" PRIMARY KEY ("id")
);

DROP INDEX IF EXISTS "PricingLineItemTemplatePrice_templateId_accommodationLevel_occupancy_key";
CREATE UNIQUE INDEX "PricingLineItemTemplatePrice_templateId_accommodationLevel_occupancy_key"
ON "PricingLineItemTemplatePrice"("templateId", "accommodationLevel", "occupancy");

DROP INDEX IF EXISTS "PricingLineItemTemplatePrice_templateId_accommodationLevel_occupancy_idx";
CREATE INDEX "PricingLineItemTemplatePrice_templateId_accommodationLevel_occupancy_idx"
ON "PricingLineItemTemplatePrice"("templateId", "accommodationLevel", "occupancy");

ALTER TABLE "PricingLineItemTemplatePrice"
  ADD CONSTRAINT "PricingLineItemTemplatePrice_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "PricingLineItemTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique constraint for template names
CREATE UNIQUE INDEX "PricingLineItemTemplate_name_key" ON "PricingLineItemTemplate"("name");

-- Update indexes for pricing items
DROP INDEX IF EXISTS "ItineraryPricingItem_itineraryId_idx";
CREATE INDEX "ItineraryPricingItem_itineraryId_accommodationLevel_occupancy_idx"
ON "ItineraryPricingItem"("itineraryId", "accommodationLevel", "occupancy");

DROP INDEX IF EXISTS "DayPricingItem_dayId_idx";
CREATE INDEX "DayPricingItem_dayId_accommodationLevel_occupancy_idx"
ON "DayPricingItem"("dayId", "accommodationLevel", "occupancy");

