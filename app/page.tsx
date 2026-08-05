"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { parseSseStream } from "./lib/sse";

interface Message {
  role: "user" | "assistant";
  content: string;
  model?: string;
  latencyMs?: number;
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

    async function loadHistory(id: string) {
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (!res.ok || cancelled) return;
      const history: HistoryMessage[] = await res.json();
      if (!cancelled) setMessages(toMessages(history));
    }

    // If a generation was still running when the page was last closed/refreshed, pick it back
    // up: show the partial text immediately, then poll until it's done and refetch the final
    // (possibly "[回覆中斷]"-marked) persisted content instead of leaving the UI stuck empty.
    async function resumeIfGenerating(id: string) {
      const res = await fetch(`/api/conversations/${id}/messages/stream/status`);
      if (!res.ok || cancelled) return;
      const status: StreamStatus = await res.json();
      if (!status.generating || cancelled) return;

      setLoading(true);
      setMessages((prev) => [...prev, { role: "assistant", content: status.partial ?? "" }]);

      pollId = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/conversations/${id}/messages/stream/status`);
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

    async function bootstrap() {
      let id = localStorage.getItem(CONVERSATION_ID_STORAGE_KEY);
      if (!id) {
        try {
          const res = await fetch("/api/conversations", { method: "POST" });
          if (!res.ok) throw new Error(`API error: ${res.status}`);
          const data: { uuid: string } = await res.json();
          id = data.uuid;
          localStorage.setItem(CONVERSATION_ID_STORAGE_KEY, id);
        } catch (err) {
          console.error("Failed to create conversation", err);
          return;
        }
      }
      if (cancelled) return;
      setConversationId(id);

      try {
        await loadHistory(id);
      } catch (err) {
        console.error("Failed to load history", err);
      }

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
      {/* Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <h1 className="text-lg font-semibold text-neutral-800">聊天機器人</h1>
      </header>

      {/* Message list */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-neutral-400">
              輸入訊息開始對話吧
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
                {m.role === "assistant" && m.model && (
                  <p className="mt-1 text-[11px] text-neutral-400">
                    {m.model} · {m.latencyMs}ms
                  </p>
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