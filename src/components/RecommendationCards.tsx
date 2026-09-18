import type { CalculatedOffer } from "@/lib/pricing";
import { buildTradeOffMessage } from "@/lib/pricing";
import ViewDealButton from "./ViewDealButton";

function DeliveryRange({ min, max }: { min: number; max: number }) {
  return (
    <span>
      {min}–{max} day{max === 1 ? "" : "s"}
    </span>
  );
}

function HighlightCard({
  label,
  offer,
  productId,
  country,
  accent,
}: {
  label: "Cheapest" | "Fastest";
  offer: CalculatedOffer;
  productId: string;
  country: string;
  accent: "cheapest" | "fastest";
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-4 sm:p-5 ${
        accent === "cheapest" ? "border-emerald-200 bg-emerald-50/50" : "border-blue-200 bg-blue-50/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
            accent === "cheapest" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
          }`}
        >
          {label}
        </span>
        {!offer.inStock && <span className="text-xs font-medium text-red-500">Out of stock</span>}
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-700">{offer.retailerName}</p>
        <p className="mt-1 text-2xl font-semibold text-neutral-900">€{offer.totalDeliveredPrice.toFixed(2)}</p>
        <p className="mt-1 text-sm text-neutral-500">
          total delivered · <DeliveryRange min={offer.deliveryMinDays} max={offer.deliveryMaxDays} /> delivery
        </p>
      </div>
      <div>
        <ViewDealButton
          offerId={offer.offerId}
          productId={productId}
          retailerId={offer.retailerId}
          country={country}
          affiliateUrl={offer.affiliateUrl}
          variant="highlight"
        />
      </div>
    </div>
  );
}

export default function RecommendationCards({
  cheapest,
  fastest,
  productId,
  country,
}: {
  cheapest: CalculatedOffer;
  fastest: CalculatedOffer;
  productId: string;
  country: string;
}) {
  const tradeOff = buildTradeOffMessage(cheapest, fastest);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <HighlightCard label="Cheapest" offer={cheapest} productId={productId} country={country} accent="cheapest" />
        {!tradeOff.sameOffer && (
          <HighlightCard label="Fastest" offer={fastest} productId={productId} country={country} accent="fastest" />
        )}
      </div>
      <p className="rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-700">{tradeOff.message}</p>
    </div>
  );
}
