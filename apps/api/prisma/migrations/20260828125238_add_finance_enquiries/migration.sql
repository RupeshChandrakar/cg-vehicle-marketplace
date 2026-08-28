-- CreateEnum
CREATE TYPE "finance_enquiry_status" AS ENUM ('new', 'contacted', 'closed');

-- CreateTable
CREATE TABLE "finance_enquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "vehicle_id" TEXT,
    "status" "finance_enquiry_status" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finance_enquiries_status_idx" ON "finance_enquiries"("status");

-- AddForeignKey
ALTER TABLE "finance_enquiries" ADD CONSTRAINT "finance_enquiries_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
