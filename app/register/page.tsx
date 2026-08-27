"use client";

import { useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "../lib/i18n/I18nProvider";

export default function RegisterPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("register.errorPasswordMismatch"));
      return;
    }

    setSubmitting(true);

    let registerRes: Response;
    try {
      registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      console.error(err);
      setError(t("register.errorGeneric"));
      setSubmitting(false);
      return;
    }

    if (!registerRes.ok) {
      // Backend validation (ADR-007 follow-up) returns a field-level message on 400
      // (e.g. "password: password must be between 8 and 72 characters") — surface it
      // instead of a generic failure so the user knows what to fix.
      const data: { message?: string } | null = await registerRes.json().catch(() => null);
      setError(
        registerRes.status === 409
          ? t("register.errorEmailTaken")
          : data?.message ?? t("register.errorGeneric")
      );
      setSubmitting(false);
      return;
    }

    // 註冊完直接串一次登入，讓使用者不用多按一次 — the account now exists no matter what
    // happens next, so this gets its own try/catch: any failure here (including a
    // network error, not just a non-ok response) should send the user to the login
    // page instead of being misreported as a registration failure.
    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!loginRes.ok) throw new Error(`auto-login failed: ${loginRes.status}`);
      window.location.href = "/";
    } catch (err) {
      console.error("Auto-login after registration failed", err);
      window.location.href = "/login";
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="mb-6 text-center text-xl font-semibold text-neutral-800">
          {t("register.title")}
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
              maxLength={255}
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
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border px-4 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-neutral-400">{t("register.passwordHint")}</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPassword" className="text-sm text-neutral-600">
              {t("register.confirmPassword")}
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-xl border px-4 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? t("register.submitting") : t("register.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          {t("register.haveAccount")}{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            {t("register.loginLink")}
          </a>
        </p>
      </div>
    </div>
  );
}
