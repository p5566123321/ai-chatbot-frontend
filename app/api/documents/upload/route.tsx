import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/app/lib/backend";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  // Backend's upload endpoint is POST /api/documents itself (multipart/form-data,
  // "file" field) — there's no separate /api/documents/upload path on the backend.
  const backendRes = await backendFetch("/api/documents", {
    method: "POST",
    body: formData,
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
  return NextResponse.json(data, { status: 201 });
}
