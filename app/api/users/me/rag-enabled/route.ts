import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/app/lib/backend";

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  const backendRes = await backendFetch("/api/users/me/rag-enabled", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!backendRes.ok) {
    // Pass the real status through (401 in particular) so the client can tell an
    // auth failure apart from a genuine backend outage instead of everything
    // collapsing into a generic 502.
    return NextResponse.json(
      { error: `backend error ${backendRes.status}` },
      { status: backendRes.status }
    );
  }

  const data = await backendRes.json();
  return NextResponse.json(data);
}
