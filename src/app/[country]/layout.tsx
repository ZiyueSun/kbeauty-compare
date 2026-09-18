import { notFound } from "next/navigation";
import { normalizeCountry } from "@/lib/types";

export default async function CountryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  if (!normalizeCountry(country)) {
    notFound();
  }
  return <>{children}</>;
}

export function generateStaticParams() {
  return [{ country: "be" }, { country: "nl" }];
}
