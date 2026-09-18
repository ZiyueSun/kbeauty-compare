import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

// Deliberately not using next/font/google here: it requires reaching
// fonts.googleapis.com at build time, which isn't guaranteed in every
// environment this project gets built in (CI, offline dev, restricted
// networks). A system font stack (defined in globals.css) keeps builds
// reliable everywhere and still looks clean/modern.

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — K-beauty price comparison for BE & NL`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Compare K-beauty product prices across retailers shipping to Belgium and the Netherlands — including shipping cost and delivery time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-neutral-900 font-sans">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
