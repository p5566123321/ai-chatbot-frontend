"use client";

import { useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "../lib/i18n/I18nProvider";

export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        // 401 covers both bad credentials and a blank-field validation failure (LoginRequest
        // is deliberately just NotBlank, see its kdoc) — either way "帳號或密碼錯誤" reads fine.
        // Anything else (e.g. a 400 the `required` attributes below didn't catch) surfaces the
        // backend's own message instead of a generic one.
        const data: { message?: string } | null = await res.json().catch(() => null);
        setError(
          res.status === 401
            ? t("login.errorInvalid")
            : data?.message ?? t("login.errorGeneric")
        );
        return;
      }

      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setError(t("login.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="mb-6 text-center text-xl font-semibold text-neutral-800">
          {t("login.title")}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm text-neutral-600">
              {t("common.email")}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border px-4 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm text-neutral-600">
              {t("common.password")}
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border px-4 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? t("login.submitting") : t("login.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          {t("login.noAccount")}{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            {t("login.registerLink")}
          </a>
        </p>
      </div>
    </div>
  );
}
