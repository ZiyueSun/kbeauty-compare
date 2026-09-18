import { redirect } from "next/navigation";

// Default destination country is Belgium (per product spec). The homepage
// itself always lives at /be or /nl so the country is explicit in the URL.
export default function RootPage() {
  redirect("/be");
}
