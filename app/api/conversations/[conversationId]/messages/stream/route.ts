import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const { message } = await req.json();

  const backendBaseUrl =
    process.env.BACKEND_BASE_URL ?? "http://localhost:8080";

  const backendRes = await fetch(
    `${backendBaseUrl}/api/conversations/${conversationId}/messages/stream`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }
  );

  if (!backendRes.ok || !backendRes.body) {
    return new Response(
      `event: error\ndata: backend error ${backendRes.status}\n\n`,
      { status: 502, headers: { "Content-Type": "text/event-stream" } }
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
