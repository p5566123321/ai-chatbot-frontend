"use client";

import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";

interface GeminiSettings {
  systemInstruction: string | null;
  temperature: number | null;
  topP: number | null;
  topK: number | null;
  candidateCount: number | null;
  maxOutputTokens: number | null;
}

interface UserSettings {
  email: string;
  geminiSettings: GeminiSettings;
}

// Every field below is optional/nullable on the backend (GeminiSettings) — an empty input means
// "no override", not zero, so form state is kept as strings and only parsed to number | null on
// submit rather than coercing empty to 0.
interface FormState {
  systemInstruction: string;
  temperature: string;
  topP: string;
  topK: string;
  candidateCount: string;
  maxOutputTokens: string;
}

const EMPTY_FORM: FormState = {
  systemInstruction: "",
  temperature: "",
  topP: "",
  topK: "",
  candidateCount: "",
  maxOutputTokens: "",
};

function toFormState(settings: GeminiSettings): FormState {
  return {
    systemInstruction: settings.systemInstruction ?? "",
    temperature: settings.temperature?.toString() ?? "",
    topP: settings.topP?.toString() ?? "",
    topK: settings.topK?.toString() ?? "",
    candidateCount: settings.candidateCount?.toString() ?? "",
    maxOutputTokens: settings.maxOutputTokens?.toString() ?? "",
  };
}

function toRequestBody(form: FormState) {
  return {
    systemInstruction: form.systemInstruction.trim() || null,
    temperature: form.temperature === "" ? null : Number(form.temperature),
    topP: form.topP === "" ? null : Number(form.topP),
    topK: form.topK === "" ? null : Number(form.topK),
    candidateCount: form.candidateCount === "" ? null : Number(form.candidateCount),
    maxOutputTokens: form.maxOutputTokens === "" ? null : Number(form.maxOutputTokens),
  };
}

function handleUnauthorized() {
  window.location.href = "/login";
}

export default function SettingsPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/users/me")
      .then(async (res) => {
        if (res.status === 401) return handleUnauthorized();
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data: UserSettings = await res.json();
        if (!cancelled) setForm(toFormState(data.geminiSettings));
      })
      .catch((err) => {
        console.error("Failed to load gemini settings", err);
        if (!cancelled) setError("載入設定失敗，請重新整理");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/users/me/gemini-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toRequestBody(form)),
      });

      if (res.status === 401) return handleUnauthorized();

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? `API error: ${res.status}`);

      setForm(toFormState(data.geminiSettings));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex h-screen flex-col bg-neutral-50">
      <AppHeader title="設定" />

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-neutral-800">
              Gemini 模型參數
            </h2>
            <p className="mb-4 text-xs text-neutral-400">
              留空的欄位會使用 Gemini 預設值。這些設定套用在你之後傳送的每一則訊息。
            </p>

            {loading ? (
              <p className="text-sm text-neutral-400">載入中…</p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-neutral-700">
                    System instruction
                  </span>
                  <textarea
                    value={form.systemInstruction}
                    onChange={(e) => updateField("systemInstruction", e.target.value)}
                    disabled={saving}
                    rows={4}
                    maxLength={10000}
                    placeholder="例如：請用繁體中文簡潔回答"
                    className={`${inputClass} resize-y`}
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-neutral-700">
                      Temperature (0–2)
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={2}
                      step={0.1}
                      value={form.temperature}
                      onChange={(e) => updateField("temperature", e.target.value)}
                      disabled={saving}
                      className={inputClass}
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-neutral-700">
                      Top P (0–1)
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={1}
                      step={0.05}
                      value={form.topP}
                      onChange={(e) => updateField("topP", e.target.value)}
                      disabled={saving}
                      className={inputClass}
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-neutral-700">
                      Top K (≥1)
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={form.topK}
                      onChange={(e) => updateField("topK", e.target.value)}
                      disabled={saving}
                      className={inputClass}
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-neutral-700">
                      Candidate count (1–8)
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={8}
                      step={1}
                      value={form.candidateCount}
                      onChange={(e) => updateField("candidateCount", e.target.value)}
                      disabled={saving}
                      className={inputClass}
                    />
                  </label>

                  <label className="col-span-2 flex flex-col gap-1">
                    <span className="text-sm font-medium text-neutral-700">
                      Max output tokens (≥1)
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={form.maxOutputTokens}
                      onChange={(e) => updateField("maxOutputTokens", e.target.value)}
                      disabled={saving}
                      className={inputClass}
                    />
                  </label>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {saved && !error && (
                  <p className="text-sm text-green-600">已儲存</p>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "儲存中…" : "儲存"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
