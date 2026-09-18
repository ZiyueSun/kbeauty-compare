import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import { getAllBrands, getPopularProducts, getRecentlyUpdatedProducts } from "@/lib/queries";
import { normalizeCountry, COUNTRY_LABELS } from "@/lib/types";
import { trackServer } from "@/lib/analytics";
import { getSessionId } from "@/lib/session";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const c = normalizeCountry(country) ?? "BE";
  const label = COUNTRY_LABELS[c];
  return buildMetadata({
    title: `K-beauty price comparison — ${label}`,
    description: `Find the cheapest and fastest way to buy K-beauty products with delivery to ${label}. Compare price, shipping cost and delivery time across retailers.`,
    path: `/${c.toLowerCase()}`,
  });
}

export default async function HomePage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const c = normalizeCountry(country) ?? "BE";
  const label = COUNTRY_LABELS[c];

  const [popular, recent, brands, sessionId] = await Promise.all([
    getPopularProducts(c, 8),
    getRecentlyUpdatedProducts(c, 6),
    getAllBrands(),
    getSessionId(),
  ]);

  void trackServer("homepage_visit", { country: c }, sessionId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          Shipping to {label}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Find where a K-beauty product is cheapest to buy
        </h1>
        <p className="mt-3 text-neutral-600">
          Price, shipping cost, and delivery time — compared across retailers that ship to {label}.
        </p>
        <div className="mt-7">
          <SearchBar country={c} />
        </div>
      </section>

      {popular.length > 0 && (
        <section className="mt-16">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">Popular products</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {popular.map((p) => (
              <ProductCard key={p.id} product={p} country={c} />
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-semibold text-neutral-900">Recent price updates</h2>
          <p className="mt-1 text-sm text-neutral-500">Offers whose prices were refreshed most recently.</p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recent.map((p) => (
              <ProductCard key={p.id} product={p} country={c} />
            ))}
          </div>
        </section>
      )}

      {brands.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-semibold text-neutral-900">Popular brands</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {brands.map((b) => (
              <Link
                key={b.id}
                href={`/${c.toLowerCase()}/brand/${b.slug}`}
                className="rounded-full border border-neutral-200 px-3.5 py-1.5 text-sm text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
