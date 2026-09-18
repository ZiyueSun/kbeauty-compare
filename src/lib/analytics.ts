/**
 * Analytics abstraction. Every call site in this app uses `track()` /
 * `trackServer()` — never a direct db insert or a direct call to a specific
 * provider. That means swapping this file's internals for PostHog or GA4
 * later (e.g. `posthog.capture(name, properties)`) requires no changes
 * anywhere else in the codebase.
 *
 * Event names used across the app:
 *  - homepage_visit
 *  - search_performed        { query, resultCount, country }
 *  - search_result_click     { productId, country }
 *  - product_viewed          { productId, slug, country }
 *  - country_changed         { from, to }
 *  - merchant_clicked        { productId, retailerId, country }
 */
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";

export type EventName =
  | "homepage_visit"
  | "search_performed"
  | "search_result_click"
  | "product_viewed"
  | "country_changed"
  | "merchant_clicked";

/** Call from Server Components (page views, etc). Never throws. */
export async function trackServer(
  name: EventName,
  properties?: Record<string, unknown>,
  sessionId?: string
) {
  try {
    await db.insert(analyticsEvents).values({
      name,
      properties: properties ?? null,
      sessionId: sessionId ?? null,
    });
  } catch (err) {
    // Analytics must never break the page.
    console.error(`[analytics] failed to log "${name}"`, err);
  }
}
