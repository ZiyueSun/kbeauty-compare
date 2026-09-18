/**
 * No product photography is scraped or fetched for the MVP (out of scope).
 * This renders a clean, deterministic placeholder — brand initial on a soft
 * gradient tied to the category — so cards still feel designed rather than
 * broken. Swap for `next/image` once a real image pipeline exists; `imageUrl`
 * on the product model is already there for that.
 */
const PALETTES: Record<string, [string, string]> = {
  Toner: ["#eef2ee", "#d7e3d6"],
  Serum: ["#f1eef6", "#ddd6ec"],
  Essence: ["#eef3f6", "#d6e2ea"],
  Sunscreen: ["#fbf3e6", "#f0dfc0"],
  Moisturizer: ["#f3efe9", "#e4d9c9"],
  Cleanser: ["#eaf1f3", "#cfe1e5"],
  "Eye Cream": ["#f4eeee", "#e6d3d3"],
  Exfoliant: ["#f0f1e8", "#dde0c9"],
  Makeup: ["#f6eef2", "#ecd6e1"],
};

function initials(brand: string, name: string) {
  const b = brand.trim().charAt(0).toUpperCase();
  const n = name.trim().charAt(0).toUpperCase();
  return `${b}${n}`;
}

export default function ProductImage({
  brand,
  name,
  category,
  className = "",
}: {
  brand: string;
  name: string;
  category: string;
  className?: string;
}) {
  const [from, to] = PALETTES[category] ?? ["#f2f2f0", "#e2e2dd"];
  return (
    <div
      className={`flex items-center justify-center select-none ${className}`}
      style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      <span className="text-[0.85em] font-medium tracking-wide text-neutral-700/70">
        {initials(brand, name)}
      </span>
    </div>
  );
}
