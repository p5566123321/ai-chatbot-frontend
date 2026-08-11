import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "../../../../../../lib/backend";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  const backendRes = await backendFetch(
    `/api/conversations/${conversationId}/messages/stream/status`
  );

  if (!backendRes.ok) {
    // Pass the real status through (401 in particular) without assuming a JSON body —
    // the backend may return an empty body for these (e.g. Spring Security's
    // authenticationEntryPoint).
    return NextResponse.json(
      { error: `backend error ${backendRes.status}` },
      { status: backendRes.status }
    );
  }

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}
