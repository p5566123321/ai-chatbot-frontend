import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const start = Date.now();

  const backendUrl = process.env.BACKEND_CHAT_URL ?? "http://localhost:8080/api/chat";

  const backendRes = await fetch(backendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ "message" :message, "conversationId":"test" }),
  });
  const data = await backendRes.json();

  return NextResponse.json(data);
}