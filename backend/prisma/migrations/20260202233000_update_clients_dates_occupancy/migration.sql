-- AlterTable
ALTER TABLE "Client" DROP COLUMN "travelEndDate",
ADD COLUMN     "occupancy" "Occupancy" NOT NULL DEFAULT 'double';


