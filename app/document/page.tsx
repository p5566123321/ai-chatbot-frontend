"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import FileUpload from "@/components/FileUpload";
import DocumentList from "@/components/DocumentList";
import { useI18n } from "../lib/i18n/I18nProvider";

export default function DocumentUploadPage() {
  const { t } = useI18n();
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <div className="flex h-screen flex-col bg-neutral-50">
      <AppHeader titleKey="page.documents.title" />

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-neutral-800">
              {t("documents.upload.title")}
            </h2>
            <p className="mb-4 text-xs text-neutral-400">
              {t("documents.upload.desc")}
            </p>
            <FileUpload onUploadSuccess={() => setRefreshSignal((n) => n + 1)} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-neutral-800">
              {t("documents.list.title")}
            </h2>
            <DocumentList refreshSignal={refreshSignal} />
          </section>
        </div>
      </main>
    </div>
  );
}
