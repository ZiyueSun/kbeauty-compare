import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "About & methodology",
  description:
    "How KB Compare works: how prices and shipping are compared, and how affiliate links are used.",
  path: "/about",
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      <div className="mt-2 space-y-3 text-neutral-600">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">About</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
        About KB Compare &amp; our methodology
      </h1>
      <p className="mt-4 text-neutral-600">
        KB Compare helps you check, before you buy a K-beauty product, where it&apos;s cheapest to buy once
        shipping and delivery time are taken into account — for delivery to Belgium or the Netherlands.
      </p>

      <Section title="How prices are compared">
        <p>
          For each retailer offer, we calculate a <strong>total delivered price</strong>: the product price plus
          the shipping cost that applies for your country and order size. If a retailer offers free shipping above
          a threshold and the product price meets it, shipping is shown as free.
        </p>
        <p>
          Offers are always sorted by total delivered price, low to high. We separately highlight the offer with
          the fastest estimated delivery time, and show the trade-off between the two in plain terms — for
          example, how much you&apos;d save by waiting a few extra days.
        </p>
      </Section>

      <Section title="Prices and shipping can change">
        <p>
          Retailers control their own prices, stock, and shipping terms, and these can change at any time. We show
          a &ldquo;last updated&rdquo; time for each offer, but we cannot guarantee that the price or delivery
          estimate shown is still accurate at the moment you check out on the retailer&apos;s site.
        </p>
      </Section>

      <Section title="Affiliate links">
        <p>
          Some outgoing &ldquo;View deal&rdquo; links are affiliate links, meaning we may earn a commission if you
          make a purchase. This does <strong>not</strong> change the price you pay.
        </p>
        <p>
          Affiliate commission never influences how offers are ranked or highlighted — ranking is based solely on
          total delivered price and delivery time.
        </p>
      </Section>

      <Section title="What this site is not">
        <p>
          KB Compare is a price comparison tool, not a skincare recommendation engine, review platform, or
          checkout service. We don&apos;t process payments or handle orders — every purchase happens directly on
          the retailer&apos;s own website.
        </p>
      </Section>
    </div>
  );
}
