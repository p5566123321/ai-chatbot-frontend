"use client";

import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { useI18n } from "../lib/i18n/I18nProvider";

interface GeminiSettings {
  model: string | null;
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
  hasGeminiApiKey: boolean;
  historyMaxMessages: number | null;
}

// Every field below is optional/nullable on the backend (GeminiSettings) — an empty input means
// "no override", not zero, so form state is kept as strings and only parsed to number | null on
// submit rather than coercing empty to 0.
interface FormState {
  model: string;
  systemInstruction: string;
  temperature: string;
  topP: string;
  topK: string;
  candidateCount: string;
  maxOutputTokens: string;
}

// "" means "使用預設" (no override) — mapped to null on submit, same convention as every other
// field here.
const EMPTY_FORM: FormState = {
  model: "",
  systemInstruction: "",
  temperature: "",
  topP: "",
  topK: "",
  candidateCount: "",
  maxOutputTokens: "",
};

function toFormState(settings: GeminiSettings): FormState {
  return {
    model: settings.model ?? "",
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
    model: form.model === "" ? null : form.model,
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
  const { t } = useI18n();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set by the mount effect on a load failure. Kept separate from `error` (which holds a
  // save failure, sometimes a raw backend message) so the effect stays translation-free
  // and its dep array can stay empty — the text is resolved at render time instead.
  const [loadFailed, setLoadFailed] = useState(false);
  const [saved, setSaved] = useState(false);

  const [hasGeminiApiKey, setHasGeminiApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const [historyMaxInput, setHistoryMaxInput] = useState("");
  const [historyMaxSaving, setHistoryMaxSaving] = useState(false);
  const [historyMaxError, setHistoryMaxError] = useState<string | null>(null);
  const [historyMaxSaved, setHistoryMaxSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/api/users/me"),
      fetch("/api/users/me/gemini-models"),
    ])
      .then(async ([userRes, modelsRes]) => {
        if (userRes.status === 401) return handleUnauthorized();
        if (!userRes.ok) throw new Error(`API error: ${userRes.status}`);
        const data: UserSettings = await userRes.json();
        if (cancelled) return;
        setForm(toFormState(data.geminiSettings));
        setHasGeminiApiKey(data.hasGeminiApiKey);
        setHistoryMaxInput(data.historyMaxMessages?.toString() ?? "");

        if (modelsRes.ok) {
          const models: string[] = await modelsRes.json();
          if (!cancelled) setModelOptions(models);
        }
      })
      .catch((err) => {
        console.error("Failed to load gemini settings", err);
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleApiKeySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setApiKeySaving(true);
    setApiKeyError(null);
    setApiKeySaved(false);

    try {
      const res = await fetch("/api/users/me/gemini-api-key", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });

      if (res.status === 401) return handleUnauthorized();

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? `API error: ${res.status}`);

      setHasGeminiApiKey(data.hasGeminiApiKey);
      setApiKeyInput("");
      setApiKeySaved(true);
    } catch (err) {
      setApiKeyError(err instanceof Error ? err.message : t("common.saveFailed"));
    } finally {
      setApiKeySaving(false);
    }
  }

  async function handleApiKeyClear() {
    setApiKeySaving(true);
    setApiKeyError(null);
    setApiKeySaved(false);

    try {
      const res = await fetch("/api/users/me/gemini-api-key", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: null }),
      });

      if (res.status === 401) return handleUnauthorized();

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? `API error: ${res.status}`);

      setHasGeminiApiKey(data.hasGeminiApiKey);
      setApiKeyInput("");
    } catch (err) {
      setApiKeyError(err instanceof Error ? err.message : t("settings.apiKey.clearFailed"));
    } finally {
      setApiKeySaving(false);
    }
  }

  async function submitHistoryMax(maxMessages: number | null) {
    setHistoryMaxSaving(true);
    setHistoryMaxError(null);
    setHistoryMaxSaved(false);

    try {
      const res = await fetch("/api/users/me/history-max-messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxMessages }),
      });

      if (res.status === 401) return handleUnauthorized();

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? `API error: ${res.status}`);

      setHistoryMaxInput(data.historyMaxMessages?.toString() ?? "");
      setHistoryMaxSaved(true);
    } catch (err) {
      setHistoryMaxError(err instanceof Error ? err.message : t("common.saveFailed"));
    } finally {
      setHistoryMaxSaving(false);
    }
  }

  function handleHistoryMaxSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitHistoryMax(historyMaxInput === "" ? null : Number(historyMaxInput));
  }

  function handleHistoryMaxClear() {
    setHistoryMaxInput("");
    submitHistoryMax(null);
  }

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
      setError(err instanceof Error ? err.message : t("common.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

  const geminiError = error ?? (loadFailed ? t("settings.loadError") : null);

  return (
    <div className="flex h-screen flex-col bg-neutral-50">
      <AppHeader titleKey="page.settings.title" />

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-neutral-800">
              {t("settings.gemini.title")}
            </h2>
            <p className="mb-4 text-xs text-neutral-400">
              {t("settings.gemini.desc")}
            </p>

            {loading ? (
              <p className="text-sm text-neutral-400">{t("common.loading")}</p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-neutral-700">Model</span>
                  <select
                    value={form.model}
                    onChange={(e) => updateField("model", e.target.value)}
                    disabled={saving}
                    className={inputClass}
                  >
                    <option value="">{t("settings.model.useDefault")}</option>
                    {modelOptions.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </label>

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
                    placeholder={t("settings.systemInstruction.placeholder")}
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

                {geminiError && <p className="text-sm text-red-600">{geminiError}</p>}
                {saved && !geminiError && (
                  <p className="text-sm text-green-600">{t("common.saved")}</p>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? t("common.saving") : t("common.save")}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-neutral-800">
              {t("settings.apiKey.title")}
            </h2>
            <p className="mb-4 text-xs text-neutral-400">
              {t("settings.apiKey.desc")}
            </p>

            {loading ? (
              <p className="text-sm text-neutral-400">{t("common.loading")}</p>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-neutral-700">
                  {t("settings.apiKey.statusLabel")}
                  {hasGeminiApiKey ? (
                    <span className="font-medium text-green-600">
                      {t("settings.apiKey.statusSet")}
                    </span>
                  ) : (
                    <span className="font-medium text-neutral-400">
                      {t("settings.apiKey.statusUnset")}
                    </span>
                  )}
                </p>

                <form onSubmit={handleApiKeySubmit} className="flex flex-col gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-neutral-700">API key</span>
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => {
                        setApiKeyInput(e.target.value);
                        setApiKeySaved(false);
                      }}
                      disabled={apiKeySaving}
                      maxLength={200}
                      placeholder={
                        hasGeminiApiKey
                          ? t("settings.apiKey.placeholderReplace")
                          : t("settings.apiKey.placeholderNew")
                      }
                      className={inputClass}
                      autoComplete="off"
                    />
                  </label>

                  {apiKeyError && <p className="text-sm text-red-600">{apiKeyError}</p>}
                  {apiKeySaved && !apiKeyError && (
                    <p className="text-sm text-green-600">{t("common.saved")}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={apiKeySaving || !apiKeyInput.trim()}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {apiKeySaving ? t("settings.apiKey.processing") : t("common.save")}
                    </button>
                    {hasGeminiApiKey && (
                      <button
                        type="button"
                        onClick={handleApiKeyClear}
                        disabled={apiKeySaving}
                        className="rounded-xl border px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {t("settings.apiKey.clear")}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </section>

          <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-neutral-800">
              {t("settings.history.title")}
            </h2>
            <p className="mb-4 text-xs text-neutral-400">
              {t("settings.history.desc")}
            </p>

            {loading ? (
              <p className="text-sm text-neutral-400">{t("common.loading")}</p>
            ) : (
              <form onSubmit={handleHistoryMaxSubmit} className="flex flex-col gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-neutral-700">
                    {t("settings.history.fieldLabel")}
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100}
                    step={1}
                    value={historyMaxInput}
                    onChange={(e) => {
                      setHistoryMaxInput(e.target.value);
                      setHistoryMaxSaved(false);
                    }}
                    disabled={historyMaxSaving}
                    placeholder={t("settings.history.placeholder")}
                    className={inputClass}
                  />
                </label>

                {historyMaxError && <p className="text-sm text-red-600">{historyMaxError}</p>}
                {historyMaxSaved && !historyMaxError && (
                  <p className="text-sm text-green-600">{t("common.saved")}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={historyMaxSaving}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {historyMaxSaving ? t("common.saving") : t("common.save")}
                  </button>
                  {historyMaxInput !== "" && (
                    <button
                      type="button"
                      onClick={handleHistoryMaxClear}
                      disabled={historyMaxSaving}
                      className="rounded-xl border px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t("settings.history.useDefault")}
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
