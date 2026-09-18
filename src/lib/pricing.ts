/**
 * Delivered-price + trade-off calculations.
 *
 * This is the ONLY place shipping/total-price math happens. UI components
 * never compute this themselves — they call these pure functions with data
 * already fetched from the database. Kept framework-free so it can be
 * unit tested in isolation.
 */

export type OfferInput = {
  offerId: string;
  retailerId: string;
  retailerName: string;
  retailerLogoUrl: string | null;
  retailerWebsiteUrl: string;
  price: number;
  currency: string;
  affiliateUrl: string;
  inStock: boolean;
  lastUpdated: Date;
  shippingCost: number;
  freeShippingThreshold: number | null;
  deliveryMinDays: number;
  deliveryMaxDays: number;
};

export type CalculatedOffer = OfferInput & {
  appliedShippingCost: number;
  freeShippingApplied: boolean;
  totalDeliveredPrice: number;
};

/**
 * total_delivered_price = product_price + applicable_shipping
 * If product price >= free_shipping_threshold, shipping is 0.
 *
 * MVP scope note: this is a single-product calculation. A basket-level
 * version would sum multiple products' prices before checking the
 * threshold — that's why threshold logic lives in this one function
 * rather than being inlined anywhere else.
 */
export function calculateOffer(offer: OfferInput): CalculatedOffer {
  const freeShippingApplied =
    offer.freeShippingThreshold != null && offer.price >= offer.freeShippingThreshold;
  const appliedShippingCost = freeShippingApplied ? 0 : offer.shippingCost;
  const totalDeliveredPrice = round2(offer.price + appliedShippingCost);

  return {
    ...offer,
    appliedShippingCost,
    freeShippingApplied,
    totalDeliveredPrice,
  };
}

export function calculateOffers(offers: OfferInput[]): CalculatedOffer[] {
  return offers.map(calculateOffer).sort((a, b) => a.totalDeliveredPrice - b.totalDeliveredPrice);
}

/** Cheapest = lowest total delivered price. Ties broken by faster min delivery. */
export function findCheapest(offers: CalculatedOffer[]): CalculatedOffer | null {
  if (offers.length === 0) return null;
  return [...offers].sort((a, b) => {
    if (a.totalDeliveredPrice !== b.totalDeliveredPrice) {
      return a.totalDeliveredPrice - b.totalDeliveredPrice;
    }
    return a.deliveryMinDays - b.deliveryMinDays;
  })[0];
}

/** Fastest = lowest max delivery days. Ties broken by lower total price. */
export function findFastest(offers: CalculatedOffer[]): CalculatedOffer | null {
  if (offers.length === 0) return null;
  return [...offers].sort((a, b) => {
    if (a.deliveryMaxDays !== b.deliveryMaxDays) {
      return a.deliveryMaxDays - b.deliveryMaxDays;
    }
    if (a.deliveryMinDays !== b.deliveryMinDays) {
      return a.deliveryMinDays - b.deliveryMinDays;
    }
    return a.totalDeliveredPrice - b.totalDeliveredPrice;
  })[0];
}

export type TradeOff = {
  sameOffer: boolean;
  priceDifference: number;
  /** Approximate extra days waited, using max-delivery-day midpoints. */
  extraDaysApprox: number;
  message: string;
};

/**
 * Builds the factual "save €X by waiting Y days longer" (or "already
 * cheapest and fastest") message. Deliberately never uses the word "best" —
 * only presents the trade-off, per product requirements.
 */
export function buildTradeOffMessage(cheapest: CalculatedOffer, fastest: CalculatedOffer): TradeOff {
  if (cheapest.offerId === fastest.offerId) {
    return {
      sameOffer: true,
      priceDifference: 0,
      extraDaysApprox: 0,
      message: `${cheapest.retailerName} is both the cheapest delivered price and the fastest delivery for this product.`,
    };
  }

  const priceDifference = round2(fastest.totalDeliveredPrice - cheapest.totalDeliveredPrice);
  const cheapestMid = (cheapest.deliveryMinDays + cheapest.deliveryMaxDays) / 2;
  const fastestMid = (fastest.deliveryMinDays + fastest.deliveryMaxDays) / 2;
  const extraDaysApprox = Math.max(0, Math.round(cheapestMid - fastestMid));

  let message: string;
  if (priceDifference <= 0) {
    message = `${cheapest.retailerName} is both cheaper and faster than ${fastest.retailerName} for this product.`;
  } else if (extraDaysApprox <= 0) {
    message = `Save €${priceDifference.toFixed(2)} by choosing ${cheapest.retailerName} instead of ${fastest.retailerName} — delivery time is about the same.`;
  } else {
    message = `Save €${priceDifference.toFixed(2)} by choosing ${cheapest.retailerName}, but delivery may take around ${extraDaysApprox} day${
      extraDaysApprox === 1 ? "" : "s"
    } longer than ${fastest.retailerName}.`;
  }

  return { sameOffer: false, priceDifference, extraDaysApprox, message };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
