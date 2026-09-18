import Link from "next/link";
import { Suspense } from "react";
import CountrySwitcher from "./CountrySwitcher";

export default function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/be" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900 text-xs font-semibold text-white">
            KB
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-neutral-900">KB Compare</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-neutral-600 sm:flex">
          <Link href="/about" className="transition hover:text-neutral-900">
            About
          </Link>
        </nav>

        <Suspense fallback={<div className="h-8 w-[104px]" />}>
          <CountrySwitcher />
        </Suspense>
      </div>
    </header>
  );
}
