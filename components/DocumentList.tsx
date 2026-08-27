"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/app/lib/i18n/I18nProvider";

interface Document {
  id: string;
  title: string;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  uploadedAt: string;
  totalChunks: number;
}

// Backend today only ever produces PENDING (see DocumentStatus.kt) — the other three
// states are reserved for once the ingestion pipeline is wired to advance them, but the
// UI is built to reflect all four so nothing else needs to change when that lands.
const STATUS_STYLE: Record<Document["status"], string> = {
  PENDING: "bg-neutral-100 text-neutral-600",
  PROCESSING: "bg-blue-100 text-blue-700",
  READY: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

function formatDate(iso: string, intlLocale: string): string {
  try {
    return new Date(iso).toLocaleString(intlLocale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function handleUnauthorized() {
  window.location.href = "/login";
}

// Pure fetch, no state — kept outside the component so the effect below can stay a plain
// promise chain (matching the shape lint expects for data-fetching effects) instead of
// routing through a hoisted callback.
async function fetchDocuments(): Promise<Document[]> {
  const res = await fetch("/api/documents");
  if (res.status === 401) {
    handleUnauthorized();
    return [];
  }
  if (!res.ok) throw new Error(`Failed to load documents: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default function DocumentList({ refreshSignal }: { refreshSignal?: number }) {
  const { t, intlLocale } = useI18n();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Bumped by the retry button to re-run the effect without needing a hoisted loader fn.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchDocuments()
      .then((docs) => {
        if (cancelled) return;
        setDocuments(docs);
        setError(false);
      })
      .catch((err) => {
        console.error("Failed to load documents", err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshSignal, reloadToken]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) throw new Error(`Failed to delete document: ${res.status}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Failed to delete document", err);
      setError(true);
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-neutral-400">{t("common.loading")}</p>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-sm text-red-600">{t("doc.loadError")}</p>
        <button
          onClick={() => setReloadToken((n) => n + 1)}
          className="text-sm font-medium text-red-700 underline hover:no-underline"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-neutral-400">
        {t("doc.empty")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm font-medium text-neutral-800">
              {doc.title}
            </span>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span>{formatDate(doc.uploadedAt, intlLocale)}</span>
              <span>·</span>
              <span>{t("doc.chunks", { count: doc.totalChunks })}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[doc.status]}`}
            >
              {t(`doc.status.${doc.status}`)}
            </span>

            {pendingDeleteId === doc.id ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === doc.id ? t("doc.deleting") : t("doc.confirmDelete")}
                </button>
                <button
                  onClick={() => setPendingDeleteId(null)}
                  disabled={deletingId === doc.id}
                  className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
                >
                  {t("common.cancel")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setPendingDeleteId(doc.id)}
                className="rounded px-2 py-1 text-xs text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
                aria-label={t("doc.deleteAria", { title: doc.title })}
              >
                {t("doc.delete")}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
