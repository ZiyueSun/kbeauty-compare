"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { COUNTRIES, COUNTRY_LABELS, type CountryCode } from "@/lib/types";

function currentCountryFromPath(pathname: string): CountryCode {
  const seg = pathname.split("/")[1]?.toUpperCase();
  return (COUNTRIES as readonly string[]).includes(seg) ? (seg as CountryCode) : "BE";
}

function swapCountryInPath(pathname: string, next: CountryCode): string {
  const parts = pathname.split("/");
  const seg = parts[1]?.toUpperCase();
  if ((COUNTRIES as readonly string[]).includes(seg)) {
    parts[1] = next.toLowerCase();
    return parts.join("/") || "/";
  }
  // Not currently on a country-scoped route (e.g. /about) — just go home.
  return `/${next.toLowerCase()}`;
}

export default function CountrySwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = currentCountryFromPath(pathname);
  const qs = searchParams?.toString();

  function handleClick(next: CountryCode) {
    if (next === current) return;
    try {
      const sid = document.cookie.match(/(?:^|; )kb_sid=([^;]+)/)?.[1];
      navigator.sendBeacon?.(
        "/api/analytics",
        new Blob([JSON.stringify({ name: "country_changed", properties: { from: current, to: next }, sessionId: sid })], {
          type: "application/json",
        })
      );
    } catch {
      // analytics must never block navigation
    }
  }

  return (
    <div className="flex items-center rounded-full border border-neutral-200 bg-neutral-50 p-0.5 text-xs font-medium">
      {COUNTRIES.map((c) => {
        const href = swapCountryInPath(pathname, c) + (qs ? `?${qs}` : "");
        const active = c === current;
        return (
          <Link
            key={c}
            href={href}
            onClick={() => handleClick(c)}
            aria-current={active ? "true" : undefined}
            className={`rounded-full px-3 py-1.5 transition ${
              active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
            }`}
            title={COUNTRY_LABELS[c]}
          >
            {c}
          </Link>
        );
      })}
    </div>
  );
}
