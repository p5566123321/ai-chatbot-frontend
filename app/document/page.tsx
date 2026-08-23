"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import FileUpload from "@/components/FileUpload";
import DocumentList from "@/components/DocumentList";

export default function DocumentUploadPage() {
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <div className="flex h-screen flex-col bg-neutral-50">
      <AppHeader title="文件管理" />

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-neutral-800">
              上傳文件
            </h2>
            <p className="mb-4 text-xs text-neutral-400">
              上傳的文件會自動切片並建立索引，聊天時會用來輔助回答你的問題。
            </p>
            <FileUpload onUploadSuccess={() => setRefreshSignal((n) => n + 1)} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-neutral-800">
              已上傳的文件
            </h2>
            <DocumentList refreshSignal={refreshSignal} />
          </section>
        </div>
      </main>
    </div>
  );
}
