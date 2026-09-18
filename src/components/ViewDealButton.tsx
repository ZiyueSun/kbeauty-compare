"use client";

export default function ViewDealButton({
  offerId,
  productId,
  retailerId,
  country,
  affiliateUrl,
  variant = "default",
}: {
  offerId: string;
  productId: string;
  retailerId: string;
  country: string;
  affiliateUrl: string;
  variant?: "default" | "highlight";
}) {
  function handleClick() {
    try {
      const sid = document.cookie.match(/(?:^|; )kb_sid=([^;]+)/)?.[1];
      const payload = JSON.stringify({ offerId, productId, retailerId, country, sessionId: sid });
      // keepalive/sendBeacon so the click is recorded even though the tab
      // is about to navigate away (target=_blank keeps this tab alive too).
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/click", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/click", { method: "POST", body: payload, keepalive: true, headers: { "Content-Type": "application/json" } });
      }
    } catch {
      // Tracking must never block the click-through.
    }
  }

  const base = "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition";
  const style =
    variant === "highlight"
      ? "bg-neutral-900 text-white hover:bg-neutral-700"
      : "border border-neutral-300 text-neutral-800 hover:border-neutral-500 hover:bg-neutral-50";

  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel="sponsored noopener nofollow"
      onClick={handleClick}
      className={`${base} ${style}`}
    >
      View deal
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M6 4h6v6M12 4 4 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}
