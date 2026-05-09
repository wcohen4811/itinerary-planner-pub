/*
  Warnings:

  - A unique constraint covering the columns `[templateId,accommodationLevel,occupancy]` on the table `PricingLineItemTemplatePrice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PricingLineItemTemplatePrice_templateId_accommodationLevel__key" ON "PricingLineItemTemplatePrice"("templateId", "accommodationLevel", "occupancy");

-- RenameIndex
ALTER INDEX "ItineraryPricingItem_itineraryId_accommodationLevel_occupancy_i" RENAME TO "ItineraryPricingItem_itineraryId_accommodationLevel_occupan_idx";

-- RenameIndex
ALTER INDEX "PricingLineItemTemplatePrice_templateId_accommodationLevel_occu" RENAME TO "PricingLineItemTemplatePrice_templateId_accommodationLevel__idx";
