"use client";

import { LOCALES } from "@/app/lib/i18n/config";
import { useI18n } from "@/app/lib/i18n/I18nProvider";

// Small inline segmented control (EN / 中文). Rendered in AppHeader on the authed pages and
// standalone on the login/register pages so the language can be picked before signing in.
export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className="inline-flex overflow-hidden rounded-lg border text-xs"
      role="group"
      aria-label={t("lang.switcherLabel")}
    >
      {LOCALES.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            className={`px-2 py-1 font-medium transition ${
              active
                ? "bg-blue-600 text-white"
                : "bg-white text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {t(code === "en" ? "lang.en" : "lang.zh")}
          </button>
        );
      })}
    </div>
  );
}
