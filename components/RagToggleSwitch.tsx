"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/app/lib/i18n/I18nProvider";

interface UserSettings {
  ragEnabled: boolean;
}

// Account-wide opt-out for RAG augmentation on chat queries (backend: users.rag_enabled,
// UserController). Lives in AppHeader next to MessageEmbeddingSwitch — same "visible from every
// page, applies to every message from then on" reasoning. Defaults on (see the backend column
// default) since RAG already runs automatically for anyone with documents; this switch only lets
// someone turn it off, not opt into it.
export default function RagToggleSwitch() {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState<boolean | null>(null); // null while loading
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/users/me")
      .then((res) => (res.ok ? (res.json() as Promise<UserSettings>) : null))
      .then((data) => {
        if (!cancelled && data) setEnabled(data.ragEnabled);
      })
      .catch((err) => console.error("Failed to load rag-enabled setting", err));

    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle() {
    if (enabled === null || saving) return;
    const next = !enabled;

    setSaving(true);
    setEnabled(next); // optimistic — reverted in the catch below on failure

    try {
      const res = await fetch("/api/users/me/rag-enabled", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data: UserSettings = await res.json();
      setEnabled(data.ragEnabled);
    } catch (err) {
      console.error("Failed to update rag-enabled setting", err);
      setEnabled(!next);
    } finally {
      setSaving(false);
    }
  }

  // Skip rendering until the current value is known, rather than flashing a default state that
  // might immediately flip once the real value loads.
  if (enabled === null) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-500">{t("rag.label")}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={t("rag.aria")}
        onClick={toggle}
        disabled={saving}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          enabled ? "bg-blue-600" : "bg-neutral-300"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-[18px]" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
