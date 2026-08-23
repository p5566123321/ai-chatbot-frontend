import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/app/lib/backend";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;

  const backendRes = await backendFetch(`/api/documents/${documentId}`, {
    method: "DELETE",
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

  return new NextResponse(null, { status: 204 });
}
