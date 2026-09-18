# KB Compare — K-beauty price comparison (BE / NL)

An MVP price comparison site for K-beauty products, scoped to Belgium and the Netherlands. For a given
product, it shows every retailer's offer sorted by **total delivered price** (product price + shipping),
highlights the cheapest and fastest options, and states the trade-off between them in plain language
(e.g. *"Save €4.20 by choosing Stylevana, but delivery may take around 9 days longer."*).

Core loop this MVP validates: **search → compare → merchant click → affiliate purchase.**

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript**
- **Tailwind CSS v4**
- **PostgreSQL** + **Drizzle ORM** (see note below — the brief suggested Prisma)
- Mock/seed data standing in for real affiliate feeds

### Why Drizzle instead of Prisma

The brief's preferred stack was Next.js/TypeScript/Tailwind/PostgreSQL/Prisma. Prisma's CLI downloads
Rust query/migration engine binaries from `binaries.prisma.sh` on install — in the sandboxed environment
this project was built and verified in, that host was blocked by network policy, so the Prisma CLI could
not run at all (`prisma migrate dev` hung, then failed the checksum fetch). Rather than ship something
unverified, I switched to **Drizzle ORM**: same schema-as-code / relational-model workflow, same
PostgreSQL target, but it's pure TypeScript with no binary downloads, so it's guaranteed to run in any
standard Node environment (including yours). If you'd strongly prefer Prisma, the schema in
`src/db/schema.ts` maps over directly — it's a small, deliberately unexciting relational model.

## Project structure

```
src/
  app/
    page.tsx                        → redirects to /be
    [country]/
      layout.tsx                    → validates country is BE|NL (404 otherwise)
      page.tsx                      → homepage (search, popular products, popular brands)
      search/page.tsx               → search results
      product/[slug]/page.tsx       → the comparison page (core feature)
      brand/[slug]/page.tsx         → simple brand listing
    about/page.tsx                  → methodology page
    not-found.tsx
    api/
      click/route.ts                → records outbound "View deal" clicks
      analytics/route.ts            → generic event ingestion (client-fired events)
  components/                       → Nav, SearchBar, ProductCard, OfferTable,
                                       RecommendationCards, ViewDealButton, ...
  lib/
    pricing.ts                      → total-delivered-price + cheapest/fastest/trade-off math
                                       (pure functions, framework-free, unit-testable)
    queries.ts                      → all Drizzle queries (the data access layer)
    analytics.ts                    → track() abstraction — swap internals for
                                       PostHog/GA4 later without touching call sites
    seo.ts, types.ts, session.ts, format.ts
  db/
    schema.ts                       → brands, products, retailers, offers,
                                       shippingRules, clickEvents, analyticsEvents
    seed.ts                         → mock data (6 retailers, 33 products, ~270 offers)
    index.ts                        → Drizzle client
  proxy.ts                          → sets an anonymous session cookie (Next 16 renamed
                                       "middleware" to "proxy")
drizzle/                            → generated SQL migration(s)
drizzle.config.ts
```

## Data model

`brands` — `products` (brand, slug, size, category, ean, aliases[] for search matching) — `retailers`
(active flag, affiliate program note) — `offers` (product × retailer × country: price, affiliateUrl,
inStock, lastUpdated — this is the table a real affiliate feed/CSV/API would upsert into) —
`shippingRules` (retailer × country: shipping cost, free-shipping threshold, delivery min/max days) —
`clickEvents` (the core conversion event) — `analyticsEvents` (generic event log).

`country` is a Postgres enum (`BE`, `NL`). Adding France or Germany later means adding the enum value and
`shippingRules` rows per retailer — no structural change to products/retailers/offers. Nothing here
assumes a single-country or single-product-per-click purchase, so basket-level shipping, price history, or
price alerts can be layered on top later without reshaping these tables.

## Pricing logic

All of it lives in `src/lib/pricing.ts`, not in components:

```
appliedShipping = (price >= freeShippingThreshold) ? 0 : shippingCost
totalDeliveredPrice = price + appliedShipping
```

Offers are sorted by `totalDeliveredPrice`. "Cheapest" = lowest total (ties broken by faster delivery).
"Fastest" = lowest max delivery days (ties broken by lower total). The trade-off sentence is built from
those two, and deliberately never uses the word "best" — it states the factual saving/delay only.

## Local development

### Prerequisites

- Node.js 20.9+ (Next.js 16 requirement)
- A PostgreSQL 14+ server

### 1. Install dependencies

```bash
npm install
```

> If you hit an `npm error Cannot read properties of null (reading 'edgesOut')` — a known npm/arborist
> issue unrelated to this project — retry with `npm install --legacy-peer-deps`.

### 2. Configure the database

```bash
cp .env.example .env
```

Edit `.env` if your Postgres isn't at `postgresql://postgres:postgres@localhost:5432/kbeauty`. Create the
database if it doesn't exist yet:

```bash
createdb kbeauty
# or: psql -c "CREATE DATABASE kbeauty;"
```

### 3. Run migrations and seed mock data

```bash
npm run db:migrate   # creates all tables (drizzle/0000_*.sql)
npm run db:seed      # loads 10 brands, 6 retailers, 33 products, ~270 offers
```

Re-running `db:seed` is safe — it truncates and reloads deterministically.

### 4. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000 — it redirects to `/be`. Try a search for "Anua Heartleaf" or "Beauty of Joseon
sunscreen", or browse the popular products on the homepage.

### Other scripts

```bash
npm run build        # production build
npm run start         # run the production build
npm run lint          # ESLint
npm run db:generate   # regenerate SQL migrations after editing src/db/schema.ts
npm run db:studio     # Drizzle Studio — browse/edit the DB in a local UI
```

## What's mocked vs. real

- **Product catalogue, retailers, shipping rules, and offer prices are mock/seed data** — realistic
  numbers, but not live-scraped or fed from real affiliate programs (scraping is explicitly out of scope
  for this MVP; see `src/db/seed.ts`).
- **Affiliate URLs are placeholders** (`https://<retailer>/product/<slug>?ref=kbeautycompare&country=...`).
- **Everything downstream of the `offers` table is real**: the delivered-price math, sorting, cheapest/
  fastest logic, click tracking, and analytics event logging all run against the actual database, so
  swapping in a real feed later is a matter of writing an ingestion job that upserts into `offers` —
  no UI or pricing-logic changes needed.
- **Analytics** logs to the `analytics_events` table today (see `src/lib/analytics.ts`). Every event goes
  through one `track()`/`trackServer()` call site, so pointing it at PostHog or GA4 later is a one-file
  change.

## Out of scope (by design, per MVP spec)

User accounts/login, reviews, skincare recommendations/AI assistant, price alerts/notifications, basket
comparison, price history charts, an admin CMS, scraping infrastructure, payments/checkout. See
`/about` in the running app for the user-facing methodology note.
