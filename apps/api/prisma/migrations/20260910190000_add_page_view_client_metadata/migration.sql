ALTER TABLE "page_views"
ADD COLUMN "viewport_width" INTEGER,
ADD COLUMN "viewport_height" INTEGER,
ADD COLUMN "color_scheme" TEXT,
ADD COLUMN "reduced_motion" BOOLEAN,
ADD COLUMN "touch_points" INTEGER,
ADD COLUMN "device_memory" DOUBLE PRECISION,
ADD COLUMN "hardware_concurrency" INTEGER,
ADD COLUMN "connection_type" TEXT;

CREATE INDEX "page_views_color_scheme_idx" ON "page_views"("color_scheme");
CREATE INDEX "page_views_reduced_motion_idx" ON "page_views"("reduced_motion");