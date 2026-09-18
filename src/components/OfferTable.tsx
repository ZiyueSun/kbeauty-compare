import type { CalculatedOffer } from "@/lib/pricing";
import { formatRelativeTime } from "@/lib/format";
import ViewDealButton from "./ViewDealButton";

export default function OfferTable({
  offers,
  productId,
  country,
}: {
  offers: CalculatedOffer[];
  productId: string;
  country: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      {/* Desktop table */}
      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <th className="px-4 py-3 font-medium">Retailer</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Shipping</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Delivery</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {offers.map((o) => (
            <tr key={o.offerId} className={!o.inStock ? "opacity-50" : undefined}>
              <td className="px-4 py-3.5">
                <p className="font-medium text-neutral-900">{o.retailerName}</p>
                {!o.inStock && <p className="text-xs text-red-500">Out of stock</p>}
              </td>
              <td className="px-4 py-3.5 text-neutral-700">€{o.price.toFixed(2)}</td>
              <td className="px-4 py-3.5 text-neutral-700">
                {o.freeShippingApplied ? (
                  <span className="text-emerald-600">Free</span>
                ) : (
                  `€${o.appliedShippingCost.toFixed(2)}`
                )}
              </td>
              <td className="px-4 py-3.5 font-semibold text-neutral-900">€{o.totalDeliveredPrice.toFixed(2)}</td>
              <td className="px-4 py-3.5 text-neutral-700">
                {o.deliveryMinDays}–{o.deliveryMaxDays} days
              </td>
              <td className="px-4 py-3.5 text-xs text-neutral-400">{formatRelativeTime(o.lastUpdated)}</td>
              <td className="px-4 py-3.5">
                {o.inStock ? (
                  <ViewDealButton
                    offerId={o.offerId}
                    productId={productId}
                    retailerId={o.retailerId}
                    country={country}
                    affiliateUrl={o.affiliateUrl}
                  />
                ) : (
                  <span className="text-xs text-neutral-400">Unavailable</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <ul className="divide-y divide-neutral-100 sm:hidden">
        {offers.map((o) => (
          <li key={o.offerId} className={`p-4 ${!o.inStock ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-900">{o.retailerName}</p>
                <p className="text-xs text-neutral-400">Updated {formatRelativeTime(o.lastUpdated)}</p>
              </div>
              <p className="text-lg font-semibold text-neutral-900">€{o.totalDeliveredPrice.toFixed(2)}</p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
              <span>Price €{o.price.toFixed(2)}</span>
              <span>Shipping {o.freeShippingApplied ? "Free" : `€${o.appliedShippingCost.toFixed(2)}`}</span>
              <span>
                {o.deliveryMinDays}–{o.deliveryMaxDays} days
              </span>
              {!o.inStock && <span className="font-medium text-red-500">Out of stock</span>}
            </div>
            {o.inStock && (
              <div className="mt-3">
                <ViewDealButton
                  offerId={o.offerId}
                  productId={productId}
                  retailerId={o.retailerId}
                  country={country}
                  affiliateUrl={o.affiliateUrl}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
