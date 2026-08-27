"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/app/lib/i18n/I18nProvider";

// Mirrors the 401 handling in app/page.tsx — any expired/missing token bounces
// back to the login page instead of leaving the upload silently stuck.
function handleUnauthorized() {
  window.location.href = "/login";
}

interface UploadedDocument {
  id: string;
  title: string;
  status: string;
  uploadedAt: string;
  totalChunks: number;
}

export default function FileUpload({
  onUploadSuccess,
}: {
  onUploadSuccess?: (data: UploadedDocument) => void;
}) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadedName(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

      const data = await res.json();
      setUploadedName(file.name);
      onUploadSuccess?.(data);
    } catch (err) {
      console.error("Failed to upload document", err);
      setError(t("upload.failed"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        className="text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {uploading && <p className="text-sm text-neutral-500">{t("upload.uploading")}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!uploading && !error && uploadedName && (
        <p className="text-sm text-green-600">
          {t("upload.success", { name: uploadedName })}
        </p>
      )}
    </div>
  );
}
