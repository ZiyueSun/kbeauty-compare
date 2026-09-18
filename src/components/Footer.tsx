import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-500">
            KB Compare — K-beauty price comparison for Belgium &amp; the Netherlands.
          </p>
          <div className="flex gap-5 text-sm text-neutral-500">
            <Link href="/about" className="hover:text-neutral-900">
              About &amp; methodology
            </Link>
          </div>
        </div>
        <p className="mt-4 text-xs text-neutral-400">
          Some outgoing links to retailers are affiliate links. This does not change the price you pay, and it
          does not affect how offers are ranked — see our{" "}
          <Link href="/about" className="underline underline-offset-2">
            methodology
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
