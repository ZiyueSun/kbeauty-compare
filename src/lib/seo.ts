import type { Metadata } from "next";

export const SITE_NAME = "KB Compare";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function buildMetadata(opts: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(opts.path);
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: opts.ogImage ? [{ url: opts.ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
    },
  };
}

/** schema.org Product + Offer structured data for a comparison page. */
export function buildProductJsonLd(opts: {
  name: string;
  description: string | null;
  image: string | null;
  brand: string;
  url: string;
  sku?: string | null;
  offers: Array<{
    price: number;
    priceCurrency: string;
    url: string;
    availability: "InStock" | "OutOfStock";
    seller: string;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    description: opts.description ?? undefined,
    image: opts.image ?? undefined,
    sku: opts.sku ?? undefined,
    brand: { "@type": "Brand", name: opts.brand },
    url: opts.url,
    offers: opts.offers.map((o) => ({
      "@type": "Offer",
      price: o.price.toFixed(2),
      priceCurrency: o.priceCurrency,
      url: o.url,
      availability: `https://schema.org/${o.availability}`,
      seller: { "@type": "Organization", name: o.seller },
    })),
  };
}
