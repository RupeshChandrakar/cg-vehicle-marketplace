-- CreateTable
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_views_session_id_idx" ON "page_views"("session_id");

-- CreateIndex
CREATE INDEX "page_views_vehicle_id_idx" ON "page_views"("vehicle_id");

-- CreateIndex
CREATE INDEX "page_views_created_at_idx" ON "page_views"("created_at");

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
