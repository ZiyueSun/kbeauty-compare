/**
 * K-Beauty Price Comparison — database schema (Drizzle ORM).
 *
 * Design goals:
 *  - `offers` is the table a real affiliate feed / CSV import / scheduled
 *    ingestion job would upsert into later — nothing else needs to change
 *    when mock data is replaced by a live feed.
 *  - `country` is a Postgres enum. Adding France/Germany later is: add the
 *    enum value + shippingRules rows per retailer. No structural migration
 *    of products/retailers/offers.
 *  - Shipping math lives only in src/lib/pricing.ts, never hardcoded in
 *    components — this table is its single source of truth.
 *  - clickEvents + analyticsEvents give us the funnel (search -> product
 *    view -> merchant click) without needing an external analytics
 *    provider on day one.
 */
import {
  pgTable,
  pgEnum,
  text,
  varchar,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const countryEnum = pgEnum("country", ["BE", "NL"]);

export const brands = pgTable("brands", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const retailers = pgTable("retailers", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  websiteUrl: text("website_url").notNull(),
  logoUrl: text("logo_url"),
  // Free-text note on the affiliate program used. Never used for ranking —
  // delivered price is always computed from price + shipping only.
  affiliateProgram: varchar("affiliate_program", { length: 120 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id),
    name: varchar("name", { length: 300 }).notNull(),
    slug: varchar("slug", { length: 300 }).notNull().unique(),
    size: varchar("size", { length: 50 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    ean: varchar("ean", { length: 20 }),
    imageUrl: text("image_url"),
    description: text("description"),
    // Alternate spellings / search keywords, used to match the same
    // physical product across differently-worded retailer feeds later.
    aliases: text("aliases")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("products_brand_idx").on(t.brandId), index("products_category_idx").on(t.category)]
);

export const offers = pgTable(
  "offers",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    retailerId: text("retailer_id")
      .notNull()
      .references(() => retailers.id, { onDelete: "cascade" }),
    country: countryEnum("country").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
    affiliateUrl: text("affiliate_url").notNull(),
    inStock: boolean("in_stock").notNull().default(true),
    lastUpdated: timestamp("last_updated").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("offers_product_retailer_country_uq").on(t.productId, t.retailerId, t.country),
    index("offers_product_country_idx").on(t.productId, t.country),
  ]
);

export const shippingRules = pgTable(
  "shipping_rules",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    retailerId: text("retailer_id")
      .notNull()
      .references(() => retailers.id, { onDelete: "cascade" }),
    country: countryEnum("country").notNull(),
    shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }).notNull(),
    // Order subtotal at/above which shipping becomes free. Null = never free.
    freeShippingThreshold: numeric("free_shipping_threshold", { precision: 10, scale: 2 }),
    deliveryMinDays: integer("delivery_min_days").notNull(),
    deliveryMaxDays: integer("delivery_max_days").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("shipping_rules_retailer_country_uq").on(t.retailerId, t.country)]
);

export const clickEvents = pgTable(
  "click_events",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    retailerId: text("retailer_id")
      .notNull()
      .references(() => retailers.id, { onDelete: "cascade" }),
    country: countryEnum("country").notNull(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    sessionId: varchar("session_id", { length: 100 }).notNull(),
  },
  (t) => [index("click_events_product_idx").on(t.productId), index("click_events_retailer_idx").on(t.retailerId)]
);

// Generic event log (homepage_visit, search_performed, product_viewed,
// country_changed, merchant_clicked, ...). Kept deliberately thin so it can
// be swapped for PostHog/GA4 later without touching call sites — see
// src/lib/analytics.ts.
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    properties: jsonb("properties"),
    sessionId: varchar("session_id", { length: 100 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("analytics_events_name_idx").on(t.name), index("analytics_events_created_idx").on(t.createdAt)]
);

// ---- Relations (for Drizzle's relational query API) ----

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const retailersRelations = relations(retailers, ({ many }) => ({
  offers: many(offers),
  shippingRules: many(shippingRules),
  clickEvents: many(clickEvents),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  offers: many(offers),
  clickEvents: many(clickEvents),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  product: one(products, { fields: [offers.productId], references: [products.id] }),
  retailer: one(retailers, { fields: [offers.retailerId], references: [retailers.id] }),
}));

export const shippingRulesRelations = relations(shippingRules, ({ one }) => ({
  retailer: one(retailers, { fields: [shippingRules.retailerId], references: [retailers.id] }),
}));

export const clickEventsRelations = relations(clickEvents, ({ one }) => ({
  product: one(products, { fields: [clickEvents.productId], references: [products.id] }),
  retailer: one(retailers, { fields: [clickEvents.retailerId], references: [retailers.id] }),
}));

export type Country = (typeof countryEnum.enumValues)[number];
