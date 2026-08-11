import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "../../../../lib/backend";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const { message } = await req.json();

  const backendRes = await backendFetch(
    `/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }
  );

  if (!backendRes.ok) {
    // Pass the real status through (401 in particular) so the client can tell an
    // auth failure apart from a genuine backend outage — the backend may return an
    // empty body for these (e.g. Spring Security's authenticationEntryPoint), so
    // don't assume a JSON body here.
    return NextResponse.json(
      { error: `backend error ${backendRes.status}` },
      { status: backendRes.status }
    );
  }

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  const backendRes = await backendFetch(
    `/api/conversations/${conversationId}/messages`
  );

  if (!backendRes.ok) {
    // Same reasoning as POST above: don't assume a JSON body on error responses.
    return NextResponse.json(
      { error: `backend error ${backendRes.status}` },
      { status: backendRes.status }
    );
  }

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}
