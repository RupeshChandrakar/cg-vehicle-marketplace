# SEO Playbook (CG Auto Mart)

## Goal
Rank for high-intent Chhattisgarh used-vehicle searches and convert organic traffic into enquiries/calls.

## Step 1: Technical Foundation (Completed)
- Added strong global metadata (title templates, description, canonical, OG, Twitter, robots directives).
- Added robots route: `/robots.txt`.
- Added sitemap route: `/sitemap.xml`.

Files:
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/robots.ts`
- `apps/web/src/app/sitemap.ts`

## Step 2: Keyword to Page Mapping (In Progress)
Use one primary keyword per page to avoid cannibalization.

### 20 Priority Keywords + URL Map

| Primary Keyword | Intent | Target URL | Page Type |
| --- | --- | --- | --- |
| used cars in raipur | Transactional | /used-cars-in-raipur | Landing |
| second hand cars in bilaspur | Transactional | /used-cars-in-bilaspur | Landing |
| used cars in durg | Transactional | /used-cars-in-durg | Landing |
| used bikes in raipur | Transactional | /used-bikes-in-raipur | Landing |
| second hand bikes in bilaspur | Transactional | /used-bikes-in-bilaspur | Landing |
| used bikes in durg | Transactional | /used-bikes-in-durg | Landing |
| used scooters in raipur | Transactional | /used-scooters-in-raipur | Landing |
| used scooters in bilaspur | Transactional | /used-scooters-in-bilaspur | Landing |
| used tractors in mahasamund | Transactional | /used-tractors-in-mahasamund | Landing |
| used tractors in rajnandgaon | Transactional | /used-tractors-in-rajnandgaon | Landing |
| commercial vehicles in korba | Transactional | /commercial-vehicles-in-korba | Landing |
| used trucks in raigarh | Transactional | /commercial-vehicles-in-raigarh | Landing |
| used cars under 3 lakh in raipur | Price | /used-cars-in-raipur-under-3-lakh | Landing |
| used cars under 5 lakh in chhattisgarh | Price | /used-cars-under-5-lakh-in-chhattisgarh | Landing |
| used bikes under 1 lakh in bilaspur | Price | /used-bikes-in-bilaspur-under-1-lakh | Landing |
| verified used cars in chhattisgarh | Trust | /verified-used-cars-in-chhattisgarh | Landing |
| verified used bikes in chhattisgarh | Trust | /verified-used-bikes-in-chhattisgarh | Landing |
| best second hand car for family in chhattisgarh | Commercial research | /best-second-hand-family-cars-in-chhattisgarh | Guide |
| best mileage bikes in chhattisgarh | Commercial research | /best-mileage-bikes-in-chhattisgarh | Guide |
| used vehicle documents checklist chhattisgarh | Informational | /used-vehicle-documents-checklist-chhattisgarh | Guide |
| used car inspection checklist chhattisgarh | Informational | /used-car-inspection-checklist-chhattisgarh | Guide |
| how to sell used vehicle in chhattisgarh | Informational | /how-to-sell-used-vehicle-in-chhattisgarh | Guide |
| used car vs second hand car in chhattisgarh | Informational | /used-car-vs-second-hand-car-in-chhattisgarh | Guide |
| used tractor buying guide chhattisgarh | Informational | /used-tractor-buying-guide-chhattisgarh | Guide |
| used bike seller checklist chhattisgarh | Informational | /used-bike-seller-checklist-chhattisgarh | Guide |
| used cars in raipur vs bilaspur | Comparison | /used-cars-in-raipur-vs-bilaspur | Guide |
| used scooter buying guide chhattisgarh | Informational | /used-scooter-buying-guide-chhattisgarh | Guide |
| used scooter inspection checklist chhattisgarh | Informational | /used-scooter-inspection-checklist-chhattisgarh | Guide |
| used scooter vs used bike chhattisgarh | Comparison | /used-scooter-vs-used-bike-chhattisgarh | Guide |

### Title and Meta Templates

1. District + Category landing
	- Title: Used {Category} in {District} | Verified Listings | CG Auto Mart
	- Meta: Explore verified used {category} in {district}, Chhattisgarh. Compare price, km, year, and contact instantly on CG Auto Mart.

2. Price intent landing
	- Title: Used {Category} Under {Budget} in {Location} | CG Auto Mart
	- Meta: Browse used {category} under {budget} in {location}. Filter by brand, year, fuel type, and connect quickly with trusted sellers.

3. Guide page
	- Title: {Topic} | CG Auto Mart Guide
	- Meta: Practical {topic} guide for Chhattisgarh buyers and sellers with checklist, price tips, and common mistakes to avoid.

### Cannibalization Rule

- One URL = one primary keyword.
- If two keywords mean same intent (example: "used cars raipur" and "second hand cars raipur"), keep one primary and use the second as secondary in H2/body.
- Never create two separate pages for same district + category intent.

## Step 3: Build Indexable Landing Pages
Create dedicated pages (not only query params) such as:
- `/used-cars-in-raipur`
- `/used-bikes-in-bilaspur`
- `/used-tractors-in-mahasamund`

Status: First batch implemented.

Implemented files:
- `apps/web/src/features/seo/location-category-landing.tsx`
- `apps/web/src/app/used-cars-in-raipur/page.tsx`
- `apps/web/src/app/used-bikes-in-bilaspur/page.tsx`
- `apps/web/src/app/used-tractors-in-mahasamund/page.tsx`
- `apps/web/src/app/sitemap.ts`

Step 3 progress update: Second batch implemented.

Additional implemented files:
- `apps/web/src/app/used-cars-in-bilaspur/page.tsx`
- `apps/web/src/app/used-cars-in-durg/page.tsx`
- `apps/web/src/app/used-bikes-in-raipur/page.tsx`

Step 3 scalability update: Programmatic all-district + main-city landing generation implemented.

Automation files:
- `apps/web/src/features/seo/landing-keywords.ts`
- `apps/web/src/app/(seo)/[slug]/page.tsx`
- `apps/web/src/app/sitemap.ts`

Notes:
- Supports both `used-*` and `second-hand-*` slugs for cars, bikes, tractors.
- Covers all seeded Chhattisgarh districts plus major city aliases mapped to their district inventory.

Each landing page should include:
- Unique H1
- 120-180 word local intro
- Fresh listings block
- FAQ block
- Internal links to nearby district/category pages

## Step 4: On-Page Template Rules
- Title length: 50-60 chars
- Meta description: 140-160 chars
- H1: keyword exact or close variant
- First paragraph: include primary keyword once
- Image alt text: real and descriptive

## Step 5: Structured Data
Add schema progressively:
- Vehicle/Product schema on vehicle detail page
- Breadcrumb schema on listing/detail pages
- FAQ schema on location/category landing pages
- Organization schema globally

## Step 6: Content Engine (Weekly)
- 2 local transactional pages
- 1 buyer guide
- 1 seller guide
- 1 comparison article

## Step 7: Authority Growth
- Local backlinks from CG blogs/news/directories
- Partner mentions from garages/dealers
- Data-led posts from marketplace trends

## Step 8: Measurement
Track weekly:
- Organic clicks (non-brand)
- Top 10 keyword count
- CTR (Search Console)
- Indexed pages
- Organic enquiry rate
- Click-to-call events

Indexing operations checklist:
- `docs/INDEXING_CHECKLIST.md`

## 30-Day Sprint Targets
- Publish 12 district-category pages
- Publish 8 supporting guides
- Acquire 10 relevant local backlinks
- Improve CTR on top 20 impression pages
