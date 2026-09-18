import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-medium text-neutral-400">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">Page not found</h1>
      <p className="mt-3 text-neutral-600">
        We couldn&apos;t find what you were looking for. It may have moved, or the product isn&apos;t in our
        catalogue yet.
      </p>
      <Link
        href="/be"
        className="mt-6 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Back to homepage
      </Link>
    </div>
  );
}
