ALTER TABLE "page_views"
ADD COLUMN "referrer" TEXT,
ADD COLUMN "referrer_host" TEXT,
ADD COLUMN "utm_source" TEXT,
ADD COLUMN "utm_medium" TEXT,
ADD COLUMN "utm_campaign" TEXT,
ADD COLUMN "language" TEXT,
ADD COLUMN "timezone" TEXT,
ADD COLUMN "screen_width" INTEGER,
ADD COLUMN "screen_height" INTEGER,
ADD COLUMN "ip_hash" TEXT,
ADD COLUMN "user_agent" TEXT,
ADD COLUMN "browser" TEXT,
ADD COLUMN "os" TEXT,
ADD COLUMN "device_type" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "region" TEXT,
ADD COLUMN "city" TEXT;

CREATE INDEX "page_views_device_type_idx" ON "page_views"("device_type");
CREATE INDEX "page_views_country_idx" ON "page_views"("country");
CREATE INDEX "page_views_utm_source_idx" ON "page_views"("utm_source");