import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "kb_sid";

/**
 * Ensures every visitor has a lightweight, anonymous session id — used only
 * to group analytics/click events together (e.g. "how many people who
 * searched X also clicked a merchant"). Not tied to any account or login;
 * there is none in this MVP.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const response = NextResponse.next();

  if (!hasSession) {
    response.cookies.set(SESSION_COOKIE, crypto.randomUUID(), {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 180, // 180 days
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
