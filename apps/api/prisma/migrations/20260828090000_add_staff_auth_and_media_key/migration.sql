-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email" TEXT,
ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "refresh_token_hash" TEXT;

-- AlterTable
ALTER TABLE "vehicle_media" DROP COLUMN "url",
ADD COLUMN     "storage_key" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "vehicle_verifications" ADD CONSTRAINT "vehicle_verifications_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
