/**
 * Seed script — mock/sample data standing in for real affiliate feeds.
 *
 * Run with: npm run db:seed
 *
 * Structured so swapping this for a real data source later is mechanical:
 * replace the `buildOffers()` step with a feed parser that upserts into the
 * same `offers` table (see src/db/schema.ts `offers` model comment).
 */
import "dotenv/config";
import { db } from "./index";
import { brands, retailers, products, offers, shippingRules } from "./schema";
import { sql } from "drizzle-orm";

// Deterministic PRNG so re-seeding gives stable, reproducible mock prices.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260101);
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

async function main() {
  console.log("Seeding database...");

  // ---- Reset (dev-only, idempotent re-seed) ----
  await db.execute(sql`TRUNCATE TABLE offers, shipping_rules, click_events, analytics_events, products, retailers, brands RESTART IDENTITY CASCADE`);

  // ---- Brands ----
  const brandDefs = [
    { name: "Beauty of Joseon", slug: "beauty-of-joseon" },
    { name: "Anua", slug: "anua" },
    { name: "COSRX", slug: "cosrx" },
    { name: "SKIN1004", slug: "skin1004" },
    { name: "Round Lab", slug: "round-lab" },
    { name: "Medicube", slug: "medicube" },
    { name: "Purito Seoul", slug: "purito-seoul" },
    { name: "Isntree", slug: "isntree" },
    { name: "TIRTIR", slug: "tirtir" },
    { name: "Dr. Althea", slug: "dr-althea" },
  ];
  const insertedBrands = await db.insert(brands).values(brandDefs).returning();
  const brandId = (slug: string) => insertedBrands.find((b) => b.slug === slug)!.id;

  // ---- Retailers ----
  const retailerDefs = [
    {
      name: "Little Wonderland",
      slug: "little-wonderland",
      websiteUrl: "https://www.littlewonderland.eu",
      affiliateProgram: "Awin",
      priceFactor: [1.08, 1.14],
    },
    {
      name: "Stylevana",
      slug: "stylevana",
      websiteUrl: "https://www.stylevana.com",
      affiliateProgram: "Partnerize",
      priceFactor: [0.84, 0.92],
    },
    {
      name: "YesStyle",
      slug: "yesstyle",
      websiteUrl: "https://www.yesstyle.com",
      affiliateProgram: "Impact",
      priceFactor: [0.9, 0.97],
    },
    {
      name: "Korean-Skincare.nl",
      slug: "korean-skincare-nl",
      websiteUrl: "https://www.korean-skincare.nl",
      affiliateProgram: "Daisycon",
      priceFactor: [0.99, 1.06],
    },
    {
      name: "Keeomi",
      slug: "keeomi",
      websiteUrl: "https://www.keeomi.com",
      affiliateProgram: "Awin",
      priceFactor: [1.01, 1.09],
    },
    {
      name: "Miin Cosmetics",
      slug: "miin-cosmetics",
      websiteUrl: "https://miincosmetics.com",
      affiliateProgram: "TradeTracker",
      priceFactor: [0.97, 1.05],
    },
  ] as const;

  const insertedRetailers = await db
    .insert(retailers)
    .values(retailerDefs.map(({ name, slug, websiteUrl, affiliateProgram }) => ({ name, slug, websiteUrl, affiliateProgram, active: true })))
    .returning();
  const retailerId = (slug: string) => insertedRetailers.find((r) => r.slug === slug)!.id;
  const retailerFactor = (slug: string) => retailerDefs.find((r) => r.slug === slug)!.priceFactor;

  // ---- Shipping rules (per retailer, per country) ----
  // base = [shippingCost, freeShippingThreshold|null, minDays, maxDays]
  type Rule = [number, number | null, number, number];
  const shippingBySlug: Record<string, { BE: Rule; NL: Rule }> = {
    "little-wonderland": { BE: [3.95, 40, 1, 2], NL: [4.95, 45, 1, 3] },
    stylevana: { BE: [6.99, 60, 10, 20], NL: [6.99, 60, 10, 20] },
    yesstyle: { BE: [5.5, 50, 7, 14], NL: [5.5, 50, 7, 14] },
    "korean-skincare-nl": { BE: [4.95, 45, 2, 4], NL: [2.95, 35, 1, 2] },
    keeomi: { BE: [4.9, 39, 3, 6], NL: [4.9, 39, 3, 6] },
    "miin-cosmetics": { BE: [5.95, 49, 4, 8], NL: [5.95, 49, 4, 8] },
  };

  const shippingRows = insertedRetailers.flatMap((r) => {
    const def = retailerDefs.find((d) => d.slug === r.slug)!;
    const rules = shippingBySlug[def.slug];
    return (["BE", "NL"] as const).map((country) => {
      const [shippingCost, freeShippingThreshold, deliveryMinDays, deliveryMaxDays] = rules[country];
      return {
        retailerId: r.id,
        country,
        shippingCost: shippingCost.toFixed(2),
        freeShippingThreshold: freeShippingThreshold != null ? freeShippingThreshold.toFixed(2) : null,
        deliveryMinDays,
        deliveryMaxDays,
      };
    });
  });
  await db.insert(shippingRules).values(shippingRows);

  // ---- Products ----
  // basePrice = an approximate EU list price used to derive retailer offers.
  const productDefs: Array<{
    brand: string;
    name: string;
    size: string;
    category: string;
    basePrice: number;
    ean?: string;
    description: string;
    aliases: string[];
  }> = [
    // Beauty of Joseon
    { brand: "beauty-of-joseon", name: "Relief Sun: Rice + Probiotics SPF50+", size: "50ml", category: "Sunscreen", basePrice: 17.5, description: "Lightweight chemical sunscreen with rice extract and probiotics, no white cast.", aliases: ["boj sun", "joseon sunscreen", "rice sunscreen"] },
    { brand: "beauty-of-joseon", name: "Glow Serum: Propolis + Niacinamide", size: "30ml", category: "Serum", basePrice: 16.9, description: "Brightening serum with propolis extract and niacinamide.", aliases: ["propolis serum", "glow serum"] },
    { brand: "beauty-of-joseon", name: "Dynasty Cream", size: "50ml", category: "Moisturizer", basePrice: 24.9, description: "Rich anti-aging cream with ginseng and snail mucin.", aliases: ["dynasty cream", "ginseng cream"] },
    { brand: "beauty-of-joseon", name: "Green Plum Refreshing Toner", size: "150ml", category: "Toner", basePrice: 15.9, description: "Vitamin C-rich toner with green plum extract for brightening.", aliases: ["green plum toner"] },

    // Anua
    { brand: "anua", name: "Heartleaf 77% Soothing Toner", size: "250ml", category: "Toner", basePrice: 19.9, description: "Soothing toner with 77% heartleaf (houttuynia cordata) extract.", aliases: ["heartleaf toner", "anua toner", "houttuynia toner"] },
    { brand: "anua", name: "Heartleaf Pore Control Cleansing Oil", size: "200ml", category: "Cleanser", basePrice: 21.9, description: "Cleansing oil that dissolves sebum and makeup without stripping skin.", aliases: ["anua cleansing oil"] },
    { brand: "anua", name: "Peach 70 Niacinamide Serum", size: "30ml", category: "Serum", basePrice: 18.5, description: "Pore-tightening serum with 70% peach extract and niacinamide.", aliases: ["peach serum", "anua niacinamide"] },
    { brand: "anua", name: "Heartleaf Silky Moisture Sun Cream SPF50+", size: "50ml", category: "Sunscreen", basePrice: 18.9, description: "Daily sunscreen with heartleaf extract, silky matte finish.", aliases: ["anua sunscreen"] },

    // COSRX
    { brand: "cosrx", name: "Advanced Snail 96 Mucin Power Essence", size: "100ml", category: "Essence", basePrice: 18.9, description: "Hydrating essence with 96% snail secretion filtrate.", aliases: ["snail essence", "cosrx snail mucin", "snail 96"] },
    { brand: "cosrx", name: "Low pH Good Morning Gel Cleanser", size: "150ml", category: "Cleanser", basePrice: 13.9, description: "Gentle low-pH gel cleanser with tea tree and BHA.", aliases: ["cosrx cleanser", "good morning cleanser"] },
    { brand: "cosrx", name: "AHA/BHA Clarifying Treatment Toner", size: "150ml", category: "Toner", basePrice: 17.9, description: "Exfoliating toner with AHA and BHA for smoother texture.", aliases: ["cosrx aha bha toner"] },
    { brand: "cosrx", name: "Salicylic Acid Daily Gentle Cleanser", size: "150ml", category: "Cleanser", basePrice: 15.9, description: "Daily cleanser with 0.5% BHA for acne-prone skin.", aliases: ["cosrx salicylic cleanser"] },
    { brand: "cosrx", name: "Snail Peptide Eye Cream", size: "25ml", category: "Eye Cream", basePrice: 19.9, description: "Eye cream with snail mucin and peptides for fine lines.", aliases: ["cosrx eye cream"] },

    // SKIN1004
    { brand: "skin1004", name: "Madagascar Centella Ampoule", size: "100ml", category: "Serum", basePrice: 18.9, description: "Soothing ampoule with 100% centella asiatica extract.", aliases: ["centella ampoule", "skin1004 ampoule"] },
    { brand: "skin1004", name: "Centella Toning Toner", size: "210ml", category: "Toner", basePrice: 16.9, description: "Calming toner with centella extract, large 210ml size.", aliases: ["skin1004 toner"] },
    { brand: "skin1004", name: "Centella Light Cream Moisturizer", size: "75ml", category: "Moisturizer", basePrice: 19.9, description: "Lightweight gel-cream moisturizer with centella extract.", aliases: ["skin1004 cream"] },

    // Round Lab
    { brand: "round-lab", name: "Dokdo Toner", size: "200ml", category: "Toner", basePrice: 17.9, description: "Mineral-rich toner using deep sea water from Dokdo island.", aliases: ["round lab toner", "dokdo toner"] },
    { brand: "round-lab", name: "Birch Juice Moisturizing Sunscreen SPF50+", size: "50ml", category: "Sunscreen", basePrice: 16.9, description: "Hydrating sunscreen formulated with birch sap.", aliases: ["round lab sunscreen", "birch sunscreen"] },
    { brand: "round-lab", name: "1025 Dokdo Cream", size: "80ml", category: "Moisturizer", basePrice: 20.9, description: "Barrier-strengthening cream with mineral water.", aliases: ["dokdo cream"] },

    // Medicube
    { brand: "medicube", name: "Zero Pore Pad 2.0", size: "70 pads", category: "Exfoliant", basePrice: 24.9, description: "Two-sided exfoliating and soothing toner pads for pores.", aliases: ["medicube pads", "zero pore pads"] },
    { brand: "medicube", name: "Collagen Jella Cream", size: "100ml", category: "Moisturizer", basePrice: 32.9, description: "Plumping jelly-textured cream with low molecular collagen.", aliases: ["jella cream", "collagen cream"] },
    { brand: "medicube", name: "PDRN Pink Peptide Serum", size: "30ml", category: "Serum", basePrice: 29.9, description: "Regenerating serum with PDRN and peptides.", aliases: ["medicube pdrn serum"] },

    // Purito Seoul
    { brand: "purito-seoul", name: "Centella Green Level Unscented Sun SPF50+", size: "60ml", category: "Sunscreen", basePrice: 16.9, description: "Fragrance-free sunscreen for sensitive skin.", aliases: ["purito sunscreen", "centella sun"] },
    { brand: "purito-seoul", name: "Wonder Releaf Centella Serum", size: "60ml", category: "Serum", basePrice: 21.9, description: "Barrier-repair serum with centella complex.", aliases: ["purito centella serum"] },
    { brand: "purito-seoul", name: "Deep Sea Water Cleansing Oil", size: "200ml", category: "Cleanser", basePrice: 19.9, description: "Cleansing oil formulated with deep sea water.", aliases: ["purito cleansing oil"] },

    // Isntree
    { brand: "isntree", name: "Hyaluronic Acid Toner Plus", size: "200ml", category: "Toner", basePrice: 18.9, description: "Multi-molecular-weight hyaluronic acid hydrating toner.", aliases: ["isntree ha toner"] },
    { brand: "isntree", name: "Green Tea Fresh Toner", size: "200ml", category: "Toner", basePrice: 17.9, description: "Lightweight toner with green tea extract for oily skin.", aliases: ["isntree green tea toner"] },
    { brand: "isntree", name: "Chestnut AHA 8% Clear Essence", size: "100ml", category: "Essence", basePrice: 21.9, description: "Exfoliating essence with 8% AHA and chestnut extract.", aliases: ["isntree aha essence"] },

    // TIRTIR
    { brand: "tirtir", name: "Mask Fit Red Cushion", size: "22g", category: "Makeup", basePrice: 21.9, description: "Full coverage cushion foundation, viral TikTok product.", aliases: ["tirtir cushion", "red cushion"] },
    { brand: "tirtir", name: "Aqua Full Coverage Cushion", size: "18g", category: "Makeup", basePrice: 19.9, description: "Dewy, hydrating full coverage cushion foundation.", aliases: ["tirtir aqua cushion"] },

    // Dr. Althea
    { brand: "dr-althea", name: "345 Relief Cream", size: "50ml", category: "Moisturizer", basePrice: 26.9, description: "Barrier-repair cream for sensitive, irritated skin.", aliases: ["dr althea cream", "345 cream"] },
    { brand: "dr-althea", name: "345 Relief Toner", size: "200ml", category: "Toner", basePrice: 22.9, description: "Calming toner for sensitive skin, part of the 345 line.", aliases: ["dr althea toner"] },
    { brand: "dr-althea", name: "345 Relief Serum", size: "35ml", category: "Serum", basePrice: 27.9, description: "Soothing serum for redness-prone sensitive skin.", aliases: ["dr althea serum"] },
  ];

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const productRows = productDefs.map((p) => ({
    brandId: brandId(p.brand),
    name: p.name,
    slug: slugify(`${p.brand} ${p.name} ${p.size}`),
    size: p.size,
    category: p.category,
    ean: undefined,
    imageUrl: null,
    description: p.description,
    aliases: p.aliases,
  }));
  const insertedProducts = await db.insert(products).values(productRows).returning();

  // ---- Offers ----
  // Each product gets offers from 3-5 of the 6 retailers, in both BE and NL.
  const retailerSlugs = retailerDefs.map((r) => r.slug);
  const now = Date.now();

  const offerRows: (typeof offers.$inferInsert)[] = [];
  insertedProducts.forEach((product, i) => {
    const def = productDefs[i];
    const offerCount = 3 + Math.floor(rand() * 3); // 3-5
    // Deterministic-but-varied retailer subset per product
    const shuffled = [...retailerSlugs].sort(() => rand() - 0.5);
    const chosen = shuffled.slice(0, offerCount);

    chosen.forEach((slug) => {
      const [lo, hi] = retailerFactor(slug);
      const factor = lo + rand() * (hi - lo);
      const price = round2(def.basePrice * factor);
      const inStock = rand() > 0.08; // ~92% in stock
      const hoursAgo = Math.floor(rand() * 72); // last updated within 3 days
      const lastUpdated = new Date(now - hoursAgo * 3600 * 1000);

      (["BE", "NL"] as const).forEach((country) => {
        offerRows.push({
          productId: product.id,
          retailerId: retailerId(slug),
          country,
          price: price.toFixed(2),
          currency: "EUR",
          affiliateUrl: `https://${retailerDefs.find((r) => r.slug === slug)!.websiteUrl.replace("https://", "")}/product/${product.slug}?ref=kbeautycompare&country=${country.toLowerCase()}`,
          inStock,
          lastUpdated,
        });
      });
    });
  });

  await db.insert(offers).values(offerRows);

  console.log(
    `Seeded ${insertedBrands.length} brands, ${insertedRetailers.length} retailers, ${insertedProducts.length} products, ${offerRows.length} offers, ${shippingRows.length} shipping rules.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
