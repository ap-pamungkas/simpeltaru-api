/*
  Warnings:

  - Changed the type of `featureId` on the `map_details` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "map_details" DROP COLUMN "featureId",
ADD COLUMN     "featureId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "map_details_mapId_featureId_key" ON "map_details"("mapId", "featureId");
