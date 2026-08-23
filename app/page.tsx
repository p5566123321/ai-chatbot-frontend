"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { parseSseStream } from "./lib/sse";
import AppHeader from "@/components/AppHeader";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface HistoryMessage {
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string | null;
}

interface StreamStatus {
  generating: boolean;
  partial?: string;
}

const CONVERSATION_ID_STORAGE_KEY = "chatbot_conversation_id";
const STATUS_POLL_INTERVAL_MS = 2000;

function toMessages(history: HistoryMessage[]): Message[] {
  return history
    .filter((m) => m.role !== "SYSTEM")
    .map((m) => ({
      role: m.role === "USER" ? "user" : "assistant",
      content: m.content,
    }));
}

// The cookie is httpOnly, so the client can't tell in advance whether the session's
// still valid — this is the one place every 401 from the backend (missing/expired
// token) funnels through to bounce back to the login page.
function handleUnauthorized() {
  window.location.href = "/login";
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingFirstChunk, setAwaitingFirstChunk] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, awaitingFirstChunk]);

  useEffect(() => {
    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | null = null;

    async function loadHistory(id: string): Promise<"ok" | "not_found" | "error"> {
      try {
        const res = await fetch(`/api/conversations/${id}/messages`);
        if (cancelled) return "error";
        if (res.status === 401) {
          handleUnauthorized();
          return "error";
        }
        // A conversationId belonging to a different account may surface as either —
        // treat both as "this id isn't usable" rather than only 404.
        if (res.status === 404 || res.status === 403) return "not_found";
        if (!res.ok) return "error";
        const history: HistoryMessage[] = await res.json();
        if (!cancelled) setMessages(toMessages(history));
        return "ok";
      } catch (err) {
        console.error("Failed to load history", err);
        return "error";
      }
    }

    // If a generation was still running when the page was last closed/refreshed, pick it back
    // up: show the partial text immediately, then poll until it's done and refetch the final
    // (possibly "[回覆中斷]"-marked) persisted content instead of leaving the UI stuck empty.
    async function resumeIfGenerating(id: string) {
      const res = await fetch(`/api/conversations/${id}/messages/stream/status`);
      if (res.status === 401) return handleUnauthorized();
      if (!res.ok || cancelled) return;
      const status: StreamStatus = await res.json();
      if (!status.generating || cancelled) return;

      setLoading(true);
      setMessages((prev) => [...prev, { role: "assistant", content: status.partial ?? "" }]);

      pollId = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/conversations/${id}/messages/stream/status`);
          if (pollRes.status === 401) {
            if (pollId) clearInterval(pollId);
            return handleUnauthorized();
          }
          if (!pollRes.ok || cancelled) return;
          const pollStatus: StreamStatus = await pollRes.json();
          if (cancelled) return;

          if (pollStatus.generating) {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { ...next[next.length - 1], content: pollStatus.partial ?? "" };
              return next;
            });
            return;
          }

          if (pollId) clearInterval(pollId);
          setLoading(false);
          await loadHistory(id);
        } catch (err) {
          console.error("Failed to poll stream status", err);
          if (pollId) clearInterval(pollId);
          setLoading(false);
        }
      }, STATUS_POLL_INTERVAL_MS);
    }

    async function createConversation(): Promise<string | null> {
      try {
        const res = await fetch("/api/conversations", { method: "POST" });
        if (res.status === 401) {
          handleUnauthorized();
          return null;
        }
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data: { uuid: string } = await res.json();
        localStorage.setItem(CONVERSATION_ID_STORAGE_KEY, data.uuid);
        return data.uuid;
      } catch (err) {
        console.error("Failed to create conversation", err);
        return null;
      }
    }

    async function bootstrap() {
      let id = localStorage.getItem(CONVERSATION_ID_STORAGE_KEY);
      if (!id) {
        id = await createConversation();
        if (!id || cancelled) return;
      }

      let historyStatus = await loadHistory(id);
      if (historyStatus === "not_found") {
        // A conversationId left over from a previous login can belong to a different
        // account — the backend 404s that exactly like an unknown id (ADR-007), so
        // drop it and start a fresh conversation instead of leaving the UI stuck.
        localStorage.removeItem(CONVERSATION_ID_STORAGE_KEY);
        id = await createConversation();
        if (!id || cancelled) return;
        historyStatus = await loadHistory(id);
      }
      if (cancelled || historyStatus === "error") return;

      setConversationId(id);

      try {
        await resumeIfGenerating(id);
      } catch (err) {
        console.error("Failed to check stream status", err);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
    };
  }, []);

  function appendToLastAssistantMessage(chunk: string) {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      next[next.length - 1] = { ...last, content: last.content + chunk };
      return next;
    });
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || !conversationId) return;

    // 先把使用者的訊息塞進畫面
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setAwaitingFirstChunk(true);

    let assistantMessageStarted = false;

    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        }
      );

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok || !res.body) throw new Error(`API error: ${res.status}`);

      for await (const { event, data } of parseSseStream(res.body)) {
        if (event === "error") {
          throw new Error(data || "stream error");
        }

        if (!assistantMessageStarted) {
          assistantMessageStarted = true;
          setAwaitingFirstChunk(false);
          setMessages((prev) => [...prev, { role: "assistant", content: data }]);
        } else {
          appendToLastAssistantMessage(data);
        }
      }

      if (!assistantMessageStarted) {
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      }
    } catch (err) {
      if (assistantMessageStarted) {
        appendToLastAssistantMessage("\n\n⚠️ 串流中斷，請稍後再試。");
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⚠️ 發生錯誤，請稍後再試。" },
        ]);
      }
      console.error(err);
    } finally {
      setLoading(false);
      setAwaitingFirstChunk(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-50">
      <AppHeader title="聊天機器人" />

      {/* Message list */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-neutral-400">
              輸入訊息開始對話吧，或先到「
              <Link href="/document" className="text-blue-600 hover:underline">
                文件管理
              </Link>
              」上傳文件來輔助回答
            </p>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white text-neutral-800 border rounded-bl-sm"
                  }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm prose-neutral max-w-none prose-p:last:mb-0 prose-pre:overflow-x-auto prose-pre:text-xs prose-code:rounded prose-code:bg-neutral-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-pre:prose-code:bg-transparent prose-pre:prose-code:p-0 prose-table:block prose-table:overflow-x-auto">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        a: ({ ...props }) => (
                          <a target="_blank" rel="noopener noreferrer" {...props} />
                        ),
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}

          {awaitingFirstChunk && (
            <div className="flex justify-start">
              <div className="max-w-[75%] rounded-2xl rounded-bl-sm border bg-white px-4 py-2 text-sm text-neutral-400 shadow-sm">
                思考中…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input bar */}
      <footer className="border-t bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="輸入訊息…（Enter 送出，Shift+Enter 換行）"
            className="flex-1 resize-none rounded-xl border px-4 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim() || !conversationId}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            送出
          </button>
        </div>
      </footer>
    </div>
  );
}