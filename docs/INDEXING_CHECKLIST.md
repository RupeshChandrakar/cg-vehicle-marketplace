# Indexing Checklist

## Goal
Get new SEO pages discovered, crawled, and indexed faster after deployment.

## Before Submission
- Set production site URL in `NEXT_PUBLIC_SITE_URL`.
- Confirm `robots.txt` is live.
- Confirm `sitemap.xml` is live.
- Confirm important landing pages open with status 200.
- Confirm canonical tags point to the intended URLs.

## Google Search Console Setup
1. Add property for the production domain.
2. Verify domain ownership using DNS.
3. Submit sitemap:
   - `/sitemap.xml`
4. Use URL Inspection on priority pages:
   - `/used-cars-in-raipur`
   - `/used-cars-in-bhilai`
   - `/used-bikes-in-raipur`
   - `/used-tractors-in-mahasamund`
   - one real vehicle detail page
5. Request indexing for the top 10 business-priority pages first.

## Bing Webmaster Setup
1. Add the same production domain.
2. Import from Google Search Console if available.
3. Submit `/sitemap.xml`.
4. Inspect the same top landing pages.

## Priority Pages to Submit First
- Homepage
- `/used-cars-in-raipur`
- `/used-cars-in-bilaspur`
- `/used-cars-in-durg`
- `/used-bikes-in-raipur`
- `/used-bikes-in-bilaspur`
- `/used-tractors-in-mahasamund`
- `/second-hand-cars-in-raipur`
- `/second-hand-bikes-in-bilaspur`
- `/second-hand-tractors-in-mahasamund`

## Post-Launch Monitoring
Check weekly in Search Console:
- Indexed pages count
- Coverage errors
- Crawled but not indexed pages
- Top queries
- CTR for landing pages
- Mobile usability issues
- Core Web Vitals

## Fix If Pages Are Not Indexing
- Improve internal links to that page.
- Add unique intro copy or FAQ depth.
- Check canonical is not pointing elsewhere.
- Ensure page is not blocked by robots or noindex.
- Make sure page is linked from homepage/footer or another indexed page.
- Re-submit after meaningful content update.

## Deployment Reminder
After production deploy, manually test:
- `/robots.txt`
- `/sitemap.xml`
- one `used-*` page
- one `second-hand-*` page
- one vehicle detail page with schema present
