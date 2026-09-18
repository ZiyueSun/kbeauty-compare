export const COUNTRIES = ["BE", "NL"] as const;
export type CountryCode = (typeof COUNTRIES)[number];

export const COUNTRY_LABELS: Record<CountryCode, string> = {
  BE: "Belgium",
  NL: "Netherlands",
};

export function isCountryCode(value: string | undefined | null): value is CountryCode {
  return !!value && (COUNTRIES as readonly string[]).includes(value.toUpperCase());
}

/** Normalizes a URL segment like "be" or "BE" into the "BE" enum value. */
export function normalizeCountry(value: string | undefined | null): CountryCode | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  return isCountryCode(upper) ? (upper as CountryCode) : null;
}

export function countryToPath(country: CountryCode): string {
  return country.toLowerCase();
}
