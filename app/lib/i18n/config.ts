// Shared between the server (RootLayout reads the cookie to set <html lang> and pick the
// initial dictionary) and the client (I18nProvider). Keep this file free of "use client"
// / "server-only" so both sides can import it.

export const LOCALES = ["en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

// English is the default per product decision — an unknown or missing cookie falls back here.
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// BCP-47 tags for <html lang> and Intl formatters. The existing copy is Traditional Chinese.
export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  zh: "zh-Hant",
};

export const INTL_LOCALE: Record<Locale, string> = {
  en: "en-US",
  zh: "zh-TW",
};

export function normalizeLocale(value: string | undefined | null): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}
