import { notFound } from "next/navigation";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import RecommendationCards from "@/components/RecommendationCards";
import OfferTable from "@/components/OfferTable";
import { getProductBySlug, getCalculatedOffersForProduct } from "@/lib/queries";
import { findCheapest, findFastest } from "@/lib/pricing";
import { normalizeCountry, COUNTRY_LABELS } from "@/lib/types";
import { trackServer } from "@/lib/analytics";
import { getSessionId } from "@/lib/session";
import { buildMetadata, buildProductJsonLd, absoluteUrl } from "@/lib/seo";
import type { Metadata } from "next";

async function loadData(countryParam: string, slug: string) {
  const c = normalizeCountry(countryParam);
  if (!c) return null;
  const product = await getProductBySlug(slug);
  if (!product) return null;
  const offers = await getCalculatedOffersForProduct(product.id, c);
  return { c, product, offers };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; slug: string }>;
}): Promise<Metadata> {
  const { country, slug } = await params;
  const data = await loadData(country, slug);
  if (!data) return buildMetadata({ title: "Product not found", description: "", path: "/", noIndex: true });

  const { c, product, offers } = data;
  const cheapest = findCheapest(offers);
  const priceLine = cheapest ? ` From €${cheapest.totalDeliveredPrice.toFixed(2)} delivered.` : "";

  return buildMetadata({
    title: `${product.brandName} ${product.name} (${product.size}) — price comparison`,
    description: `Compare ${product.brandName} ${product.name} prices, shipping cost and delivery time across retailers shipping to ${COUNTRY_LABELS[c]}.${priceLine}`,
    path: `/${c.toLowerCase()}/product/${product.slug}`,
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ country: string; slug: string }>;
}) {
  const { country, slug } = await params;
  const data = await loadData(country, slug);
  if (!data) notFound();
  const { c, product, offers } = data;

  const sessionId = await getSessionId();
  void trackServer("product_viewed", { productId: product.id, slug: product.slug, country: c }, sessionId);

  const cheapest = findCheapest(offers);
  const fastest = findFastest(offers);
  const inStockOffers = offers.filter((o) => o.inStock);

  const jsonLd = buildProductJsonLd({
    name: `${product.brandName} ${product.name}`,
    description: product.description,
    image: product.imageUrl,
    brand: product.brandName,
    sku: product.ean,
    url: absoluteUrl(`/${c.toLowerCase()}/product/${product.slug}`),
    offers: offers.map((o) => ({
      price: o.totalDeliveredPrice,
      priceCurrency: o.currency,
      url: o.affiliateUrl,
      availability: o.inStock ? "InStock" : "OutOfStock",
      seller: o.retailerName,
    })),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-xs text-neutral-400">
        <Link href={`/${c.toLowerCase()}`} className="hover:text-neutral-600">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/${c.toLowerCase()}/brand/${product.brandSlug}`} className="hover:text-neutral-600">
          {product.brandName}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-neutral-500">{product.name}</span>
      </nav>

      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-[220px_1fr] sm:gap-8">
        <ProductImage
          brand={product.brandName}
          name={product.name}
          category={product.category}
          className="aspect-square w-full rounded-xl text-4xl"
        />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{product.brandName}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[28px]">
            {product.name}
          </h1>
          <p className="mt-1 text-neutral-500">
            {product.size} · {product.category}
          </p>
          {product.description && <p className="mt-3 max-w-xl text-sm text-neutral-600">{product.description}</p>}
          <p className="mt-4 text-xs text-neutral-400">
            Comparing delivered prices for <span className="font-medium text-neutral-600">{COUNTRY_LABELS[c]}</span>{" "}
            · {offers.length} retailer{offers.length === 1 ? "" : "s"} found
          </p>
        </div>
      </div>

      <div className="mt-10">
        {inStockOffers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center text-neutral-500">
            No offers are currently available for {COUNTRY_LABELS[c]}. Try switching country above, or check back
            later.
          </div>
        ) : (
          cheapest &&
          fastest && (
            <RecommendationCards cheapest={cheapest} fastest={fastest} productId={product.id} country={c} />
          )
        )}
      </div>

      {offers.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-neutral-500">All offers, sorted by total delivered price</h2>
          <OfferTable offers={offers} productId={product.id} country={c} />
        </div>
      )}
    </div>
  );
}
