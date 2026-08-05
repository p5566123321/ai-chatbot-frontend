import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const { message } = await req.json();

  const backendBaseUrl =
    process.env.BACKEND_BASE_URL ?? "http://localhost:8080";

  const backendRes = await fetch(
    `${backendBaseUrl}/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }
  );

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  const backendBaseUrl =
    process.env.BACKEND_BASE_URL ?? "http://localhost:8080";

  const backendRes = await fetch(
    `${backendBaseUrl}/api/conversations/${conversationId}/messages`
  );

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}
