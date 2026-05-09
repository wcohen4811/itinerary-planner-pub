/*
  Warnings:

  - A unique constraint covering the columns `[templateId,accommodationLevel,occupancy]` on the table `PricingLineItemTemplatePrice` will be added. If there are existing duplicate values, this will fail.

*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PricingLineItemTemplatePrice') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'PricingLineItemTemplatePrice_templateId_accommodationLevel__key') THEN
      EXECUTE 'CREATE UNIQUE INDEX "PricingLineItemTemplatePrice_templateId_accommodationLevel__key" ON "PricingLineItemTemplatePrice"("templateId", "accommodationLevel", "occupancy")';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ItineraryPricingItem_itineraryId_accommodationLevel_occupancy_i') THEN
      EXECUTE 'ALTER INDEX "ItineraryPricingItem_itineraryId_accommodationLevel_occupancy_i" RENAME TO "ItineraryPricingItem_itineraryId_accommodationLevel_occupan_idx"';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'PricingLineItemTemplatePrice_templateId_accommodationLevel_occu') THEN
      EXECUTE 'ALTER INDEX "PricingLineItemTemplatePrice_templateId_accommodationLevel_occu" RENAME TO "PricingLineItemTemplatePrice_templateId_accommodationLevel__idx"';
    END IF;
  END IF;
END $$;
