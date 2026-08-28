-- CreateEnum
CREATE TYPE "reel_template" AS ENUM ('classic', 'ken_burns');

-- CreateEnum
CREATE TYPE "reel_status" AS ENUM ('processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "reel_publish_status" AS ENUM ('draft', 'published', 'scheduled');

-- CreateTable
CREATE TABLE "reels" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "template" "reel_template" NOT NULL,
    "status" "reel_status" NOT NULL DEFAULT 'processing',
    "storage_key" TEXT,
    "thumbnail_storage_key" TEXT,
    "duration_seconds" DOUBLE PRECISION,
    "error_message" TEXT,
    "publish_status" "reel_publish_status" NOT NULL DEFAULT 'draft',
    "platform" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reels_vehicle_id_idx" ON "reels"("vehicle_id");

-- CreateIndex
CREATE INDEX "reels_status_idx" ON "reels"("status");

-- AddForeignKey
ALTER TABLE "reels" ADD CONSTRAINT "reels_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reels" ADD CONSTRAINT "reels_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
