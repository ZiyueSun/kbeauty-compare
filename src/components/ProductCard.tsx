import Link from "next/link";
import ProductImage from "./ProductImage";
import type { ProductSummary } from "@/lib/queries";
import type { CountryCode } from "@/lib/types";

export default function ProductCard({ product, country }: { product: ProductSummary; country: CountryCode }) {
  return (
    <Link
      href={`/${country.toLowerCase()}/product/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:border-neutral-300 hover:shadow-sm"
    >
      <ProductImage
        brand={product.brandName}
        name={product.name}
        category={product.category}
        className="aspect-square w-full text-2xl"
      />
      <div className="p-3.5">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{product.brandName}</p>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-medium text-neutral-900 group-hover:underline">
          {product.name}
        </h3>
        <p className="mt-0.5 text-xs text-neutral-500">{product.size}</p>
        <div className="mt-2 flex items-baseline justify-between">
          {product.fromPrice != null ? (
            <p className="text-sm text-neutral-900">
              <span className="text-xs text-neutral-500">from </span>
              <span className="font-semibold">€{product.fromPrice.toFixed(2)}</span>
            </p>
          ) : (
            <p className="text-xs text-neutral-400">No offers yet</p>
          )}
          {product.offerCount > 0 && (
            <span className="text-xs text-neutral-400">{product.offerCount} retailers</span>
          )}
        </div>
      </div>
    </Link>
  );
}
