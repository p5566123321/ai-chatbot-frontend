import { NextResponse } from "next/server";
import { backendFetch } from "../../lib/backend";

export async function POST() {
  const backendRes = await backendFetch("/api/conversations", {
    method: "POST",
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
