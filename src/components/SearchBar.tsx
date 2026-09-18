"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({
  country,
  initialQuery = "",
  size = "large",
}: {
  country: string;
  initialQuery?: string;
  size?: "large" | "compact";
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(`/${country.toLowerCase()}/search${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  const isLarge = size === "large";

  return (
    <form onSubmit={onSubmit} role="search" className="w-full">
      <div
        className={`flex items-center gap-2 rounded-full border border-neutral-300 bg-white shadow-sm transition focus-within:border-neutral-500 ${
          isLarge ? "px-5 py-3.5" : "px-4 py-2.5"
        }`}
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4 flex-none text-neutral-400"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="9" cy="9" r="6.5" />
          <path d="M18 18l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search K-beauty products, e.g. “Anua Heartleaf Toner”"
          aria-label="Search K-beauty products"
          className={`w-full min-w-0 flex-1 bg-transparent text-neutral-900 outline-none placeholder:text-neutral-400 ${
            isLarge ? "text-base" : "text-sm"
          }`}
        />
        <button
          type="submit"
          className={`flex-none rounded-full bg-neutral-900 font-medium text-white transition hover:bg-neutral-700 ${
            isLarge ? "px-4 py-2 text-sm" : "px-3.5 py-1.5 text-xs"
          }`}
        >
          Search
        </button>
      </div>
    </form>
  );
}
