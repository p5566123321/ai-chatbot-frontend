import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/app/lib/backend";

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  const backendRes = await backendFetch("/api/users/me/gemini-api-key", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!backendRes.ok) {
    // Pass the real status through (400 for an overly long key, 401 for auth) so the client
    // can render a real message instead of everything collapsing into a generic 502.
    const data = await backendRes.json().catch(() => ({
      error: `backend error ${backendRes.status}`,
    }));
    return NextResponse.json(data, { status: backendRes.status });
  }

  const data = await backendRes.json();
  return NextResponse.json(data);
}
