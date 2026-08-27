"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/app/lib/i18n/I18nProvider";
import type { MessageKey } from "@/app/lib/i18n/messages";
import LanguageSwitcher from "./LanguageSwitcher";
import MessageEmbeddingSwitch from "./MessageEmbeddingSwitch";
import RagToggleSwitch from "./RagToggleSwitch";

const NAV_ITEMS: { href: string; labelKey: MessageKey }[] = [
  { href: "/", labelKey: "nav.chat" },
  { href: "/document", labelKey: "nav.documents" },
  { href: "/settings", labelKey: "nav.settings" },
];

// Mirrors the 401 handling elsewhere — logging out always lands back on /login.
async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.href = "/login";
  }
}

export default function AppHeader({ titleKey }: { titleKey: MessageKey }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-semibold text-neutral-800">{t(titleKey)}</h1>
        <nav className="flex items-center gap-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition ${
                  active
                    ? "font-medium text-blue-600"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <RagToggleSwitch />
        <MessageEmbeddingSwitch />
        <LanguageSwitcher />
        <button
          onClick={logout}
          className="text-sm text-neutral-500 transition hover:text-neutral-800"
        >
          {t("action.logout")}
        </button>
      </div>
    </header>
  );
}
