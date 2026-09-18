import { NextResponse } from "next/server";
import { trackServer, type EventName } from "@/lib/analytics";

const VALID_EVENTS: EventName[] = [
  "homepage_visit",
  "search_performed",
  "search_result_click",
  "product_viewed",
  "country_changed",
  "merchant_clicked",
];

/** Generic event ingestion for events fired from client components (e.g. country_changed). */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { name, properties, sessionId } = (body ?? {}) as Record<string, unknown>;

  if (typeof name !== "string" || !VALID_EVENTS.includes(name as EventName)) {
    return NextResponse.json({ error: "invalid event name" }, { status: 400 });
  }

  await trackServer(
    name as EventName,
    typeof properties === "object" && properties !== null ? (properties as Record<string, unknown>) : undefined,
    typeof sessionId === "string" ? sessionId : undefined
  );

  return NextResponse.json({ ok: true });
}
