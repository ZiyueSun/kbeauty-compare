import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import { searchProducts } from "@/lib/queries";
import { normalizeCountry, COUNTRY_LABELS } from "@/lib/types";
import { trackServer } from "@/lib/analytics";
import { getSessionId } from "@/lib/session";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const { q } = await searchParams;
  const c = normalizeCountry(country) ?? "BE";
  return buildMetadata({
    title: q ? `Search results for "${q}"` : "Search",
    description: `Search K-beauty products and compare delivered prices for ${COUNTRY_LABELS[c]}.`,
    path: `/${c.toLowerCase()}/search${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    noIndex: true,
  });
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { country } = await params;
  const { q } = await searchParams;
  const c = normalizeCountry(country) ?? "BE";
  const query = (q ?? "").trim();

  const [results, sessionId] = await Promise.all([
    query ? searchProducts(query, c) : Promise.resolve([]),
    getSessionId(),
  ]);

  if (query) {
    void trackServer("search_performed", { query, resultCount: results.length, country: c }, sessionId);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <SearchBar country={c} initialQuery={query} />
      </div>

      <div className="mt-8">
        {query ? (
          <p className="text-sm text-neutral-500">
            {results.length} result{results.length === 1 ? "" : "s"} for <span className="font-medium text-neutral-800">&ldquo;{query}&rdquo;</span>
          </p>
        ) : (
          <p className="text-sm text-neutral-500">Enter a product or brand name to compare delivered prices.</p>
        )}

        {query && results.length === 0 && (
          <div className="mt-10 rounded-xl border border-dashed border-neutral-200 p-10 text-center text-neutral-500">
            No products matched &ldquo;{query}&rdquo;. Try a shorter search, e.g. the brand name only.
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} country={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
