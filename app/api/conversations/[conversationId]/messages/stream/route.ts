import { NextRequest } from "next/server";
import { backendFetch } from "../../../../../lib/backend";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const { message } = await req.json();

  const backendRes = await backendFetch(
    `/api/conversations/${conversationId}/messages/stream`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }
  );

  if (!backendRes.ok || !backendRes.body) {
    // Pass the real status through (401 in particular) so the client's `!res.ok` check
    // can tell an auth failure apart from a genuine backend outage. Statuses like
    // 204/205/304 forbid a response body though, so only forward a real failure status —
    // the (unexpected) ok-but-bodyless case falls back to 502 rather than risking the
    // Response constructor throwing on an ok body-forbidden status.
    const status = !backendRes.ok ? backendRes.status : 502;
    return new Response(
      `event: error\ndata: backend error ${backendRes.status}\n\n`,
      { status, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const reader = backendRes.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // 後端已經是 SSE 格式（event: message\ndata: xxx\n\n），直接原樣轉發
          controller.enqueue(value);
        }
      } catch (err) {
        controller.enqueue(
          new TextEncoder().encode(`event: error\ndata: stream failed\n\n`)
        );
      } finally {
        controller.close();
      }
    },
    cancel() {
      reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
