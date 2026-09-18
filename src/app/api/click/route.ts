import { NextResponse } from "next/server";
import { db } from "@/db";
import { clickEvents } from "@/db/schema";
import { trackServer } from "@/lib/analytics";
import { isCountryCode } from "@/lib/types";

/**
 * Records an outbound "View deal" click. Called via sendBeacon/fetch from
 * ViewDealButton right as the user is taken to the retailer's affiliate URL.
 * This is the core conversion event of the MVP funnel.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { offerId, productId, retailerId, country, sessionId } = (body ?? {}) as Record<string, unknown>;

  if (typeof productId !== "string" || typeof retailerId !== "string" || typeof country !== "string" || !isCountryCode(country)) {
    return NextResponse.json({ error: "missing or invalid fields" }, { status: 400 });
  }

  const sid = typeof sessionId === "string" && sessionId ? sessionId : "unknown";

  try {
    await db.insert(clickEvents).values({
      productId,
      retailerId,
      country: country.toUpperCase() as "BE" | "NL",
      sessionId: sid,
    });
    await trackServer("merchant_clicked", { productId, retailerId, offerId, country }, sid);
  } catch (err) {
    console.error("[api/click] failed to record click", err);
    return NextResponse.json({ error: "failed to record" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
