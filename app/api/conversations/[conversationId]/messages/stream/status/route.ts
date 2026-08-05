import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  const backendBaseUrl =
    process.env.BACKEND_BASE_URL ?? "http://localhost:8080";

  const backendRes = await fetch(
    `${backendBaseUrl}/api/conversations/${conversationId}/messages/stream/status`
  );

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}
