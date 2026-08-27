"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  HTML_LANG,
  INTL_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
} from "./config";
import { messages, type MessageKey } from "./messages";

type TranslateVars = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  /** BCP-47 tag for Intl formatters (e.g. Date#toLocaleString). */
  intlLocale: string;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: TranslateVars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match
  );
}

// `initialLocale` comes from the server (RootLayout reads the cookie) so the first client
// render matches SSR — no flash, no hydration mismatch. Changing the language updates the
// cookie so the next full page load is server-rendered in the chosen language too.
export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    document.documentElement.lang = HTML_LANG[next];
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: TranslateVars) => {
      const dict = messages[locale] ?? messages[DEFAULT_LOCALE];
      const template = dict[key] ?? messages[DEFAULT_LOCALE][key] ?? key;
      return interpolate(template, vars);
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, intlLocale: INTL_LOCALE[locale], setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an <I18nProvider>");
  }
  return ctx;
}
