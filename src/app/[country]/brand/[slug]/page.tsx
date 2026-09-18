import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { getBrandBySlug, getProductsByBrand } from "@/lib/queries";
import { normalizeCountry, COUNTRY_LABELS } from "@/lib/types";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; slug: string }>;
}): Promise<Metadata> {
  const { country, slug } = await params;
  const c = normalizeCountry(country) ?? "BE";
  const brand = await getBrandBySlug(slug);
  if (!brand) return buildMetadata({ title: "Brand not found", description: "", path: "/", noIndex: true });

  return buildMetadata({
    title: `${brand.name} — price comparison`,
    description: `Compare ${brand.name} product prices, shipping cost and delivery time across retailers shipping to ${COUNTRY_LABELS[c]}.`,
    path: `/${c.toLowerCase()}/brand/${brand.slug}`,
  });
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ country: string; slug: string }>;
}) {
  const { country, slug } = await params;
  const c = normalizeCountry(country) ?? "BE";
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const products = await getProductsByBrand(brand.id, c);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Brand</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">{brand.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {products.length} product{products.length === 1 ? "" : "s"} · prices for {COUNTRY_LABELS[c]}
      </p>

      {products.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} country={c} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-neutral-500">No products found for this brand yet.</p>
      )}
    </div>
  );
}
