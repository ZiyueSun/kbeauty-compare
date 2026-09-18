import { db } from "@/db";
import { brands, products, offers, retailers, shippingRules } from "@/db/schema";
import { and, asc, desc, eq, ilike, or, sql, inArray } from "drizzle-orm";
import type { CountryCode } from "./types";
import { calculateOffers, type OfferInput } from "./pricing";

export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  size: string;
  category: string;
  brandName: string;
  brandSlug: string;
  imageUrl: string | null;
  /** Lowest total delivered price currently available in this country, if any. */
  fromPrice: number | null;
  offerCount: number;
};

/**
 * Attaches a "from €X" price to a list of products for a given country, by
 * pulling every offer for those products and taking the cheapest delivered
 * price per product. One query regardless of list size.
 */
async function attachFromPrice(
  rows: { id: string; slug: string; name: string; size: string; category: string; brandName: string; brandSlug: string; imageUrl: string | null }[],
  country: CountryCode
): Promise<ProductSummary[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const offerRows = await db
    .select({
      productId: offers.productId,
      price: offers.price,
      shippingCost: shippingRules.shippingCost,
      freeShippingThreshold: shippingRules.freeShippingThreshold,
    })
    .from(offers)
    .innerJoin(retailers, eq(offers.retailerId, retailers.id))
    .innerJoin(
      shippingRules,
      and(eq(shippingRules.retailerId, offers.retailerId), eq(shippingRules.country, offers.country))
    )
    .where(and(inArray(offers.productId, ids), eq(offers.country, country), eq(retailers.active, true), eq(offers.inStock, true)));

  const cheapestByProduct = new Map<string, number>();
  const countByProduct = new Map<string, number>();
  for (const row of offerRows) {
    const price = Number(row.price);
    const shippingCost = Number(row.shippingCost);
    const threshold = row.freeShippingThreshold != null ? Number(row.freeShippingThreshold) : null;
    const applied = threshold != null && price >= threshold ? 0 : shippingCost;
    const total = Math.round((price + applied) * 100) / 100;
    countByProduct.set(row.productId, (countByProduct.get(row.productId) ?? 0) + 1);
    const current = cheapestByProduct.get(row.productId);
    if (current == null || total < current) {
      cheapestByProduct.set(row.productId, total);
    }
  }

  return rows.map((r) => ({
    ...r,
    fromPrice: cheapestByProduct.get(r.id) ?? null,
    offerCount: countByProduct.get(r.id) ?? 0,
  }));
}

const productSelect = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  size: products.size,
  category: products.category,
  imageUrl: products.imageUrl,
  brandName: brands.name,
  brandSlug: brands.slug,
};

export async function searchProducts(query: string, country: CountryCode): Promise<ProductSummary[]> {
  const q = query.trim();
  if (!q) return [];
  const like = `%${q}%`;

  const rows = await db
    .select(productSelect)
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .where(
      or(
        ilike(products.name, like),
        ilike(brands.name, like),
        ilike(products.category, like),
        sql`EXISTS (SELECT 1 FROM unnest(${products.aliases}) AS a WHERE a ILIKE ${like})`
      )
    )
    .orderBy(asc(products.name))
    .limit(40);

  return attachFromPrice(rows, country);
}

export async function getPopularProducts(country: CountryCode, limit = 8): Promise<ProductSummary[]> {
  // No real traffic yet, so "popular" = a fixed curated set (first product
  // per brand), which reads naturally and stays deterministic. This is the
  // seam to swap in real popularity (e.g. click counts) once there's data.
  const rows = await db
    .select(productSelect)
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .orderBy(asc(brands.name), asc(products.name))
    .limit(limit * 3); // over-fetch, then dedupe by brand below

  const seenBrands = new Set<string>();
  const picked = [];
  for (const row of rows) {
    if (seenBrands.has(row.brandSlug)) continue;
    seenBrands.add(row.brandSlug);
    picked.push(row);
    if (picked.length >= limit) break;
  }

  return attachFromPrice(picked, country);
}

export async function getRecentlyUpdatedProducts(country: CountryCode, limit = 6): Promise<ProductSummary[]> {
  // "Recent price comparisons" = products whose offers were most recently
  // refreshed — real signal from the offers table rather than a mock flag.
  const recentProductIds = await db
    .select({
      productId: offers.productId,
      mostRecent: sql<Date>`max(${offers.lastUpdated})`.as("most_recent"),
    })
    .from(offers)
    .where(eq(offers.country, country))
    .groupBy(offers.productId)
    .orderBy(desc(sql`max(${offers.lastUpdated})`))
    .limit(limit);

  if (recentProductIds.length === 0) return [];
  const ids = recentProductIds.map((r) => r.productId);

  const rows = await db
    .select(productSelect)
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .where(inArray(products.id, ids));

  const withPrice = await attachFromPrice(rows, country);
  // Preserve recency order.
  const order = new Map(ids.map((id, i) => [id, i]));
  return withPrice.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function getAllBrands() {
  return db.select().from(brands).orderBy(asc(brands.name));
}

export async function getBrandBySlug(slug: string) {
  const rows = await db.select().from(brands).where(eq(brands.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getProductsByBrand(brandId: string, country: CountryCode): Promise<ProductSummary[]> {
  const rows = await db
    .select(productSelect)
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .where(eq(products.brandId, brandId))
    .orderBy(asc(products.name));

  return attachFromPrice(rows, country);
}

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  size: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  ean: string | null;
  brandName: string;
  brandSlug: string;
};

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      size: products.size,
      category: products.category,
      description: products.description,
      imageUrl: products.imageUrl,
      ean: products.ean,
      brandName: brands.name,
      brandSlug: brands.slug,
    })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .where(eq(products.slug, slug))
    .limit(1);

  return rows[0] ?? null;
}

/** Fetches + calculates every offer for a product in a country, cheapest first. */
export async function getCalculatedOffersForProduct(productId: string, country: CountryCode) {
  const rows = await db
    .select({
      offerId: offers.id,
      retailerId: retailers.id,
      retailerName: retailers.name,
      retailerLogoUrl: retailers.logoUrl,
      retailerWebsiteUrl: retailers.websiteUrl,
      price: offers.price,
      currency: offers.currency,
      affiliateUrl: offers.affiliateUrl,
      inStock: offers.inStock,
      lastUpdated: offers.lastUpdated,
      shippingCost: shippingRules.shippingCost,
      freeShippingThreshold: shippingRules.freeShippingThreshold,
      deliveryMinDays: shippingRules.deliveryMinDays,
      deliveryMaxDays: shippingRules.deliveryMaxDays,
    })
    .from(offers)
    .innerJoin(retailers, eq(offers.retailerId, retailers.id))
    .innerJoin(
      shippingRules,
      and(eq(shippingRules.retailerId, offers.retailerId), eq(shippingRules.country, offers.country))
    )
    .where(and(eq(offers.productId, productId), eq(offers.country, country), eq(retailers.active, true)));

  const input: OfferInput[] = rows.map((r) => ({
    offerId: r.offerId,
    retailerId: r.retailerId,
    retailerName: r.retailerName,
    retailerLogoUrl: r.retailerLogoUrl,
    retailerWebsiteUrl: r.retailerWebsiteUrl,
    price: Number(r.price),
    currency: r.currency,
    affiliateUrl: r.affiliateUrl,
    inStock: r.inStock,
    lastUpdated: r.lastUpdated,
    shippingCost: Number(r.shippingCost),
    freeShippingThreshold: r.freeShippingThreshold != null ? Number(r.freeShippingThreshold) : null,
    deliveryMinDays: r.deliveryMinDays,
    deliveryMaxDays: r.deliveryMaxDays,
  }));

  return calculateOffers(input);
}

export async function getOfferForClick(offerId: string) {
  const rows = await db
    .select({
      offerId: offers.id,
      productId: offers.productId,
      retailerId: offers.retailerId,
      affiliateUrl: offers.affiliateUrl,
    })
    .from(offers)
    .where(eq(offers.id, offerId))
    .limit(1);
  return rows[0] ?? null;
}
