-- CreateTable
CREATE TABLE "DayPricing" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "accommodationLevel" "AccommodationLevel" NOT NULL,
    "activityPriceCents" INTEGER NOT NULL DEFAULT 0,
    "transferPriceCents" INTEGER NOT NULL DEFAULT 0,
    "accommodationPriceCents" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DayPricing_dayId_accommodationLevel_idx" ON "DayPricing"("dayId", "accommodationLevel");

-- CreateIndex
CREATE UNIQUE INDEX "DayPricing_dayId_accommodationLevel_key" ON "DayPricing"("dayId", "accommodationLevel");

-- AddForeignKey
ALTER TABLE "DayPricing" ADD CONSTRAINT "DayPricing_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;
