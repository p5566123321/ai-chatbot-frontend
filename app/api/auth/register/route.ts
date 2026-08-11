import { NextRequest, NextResponse } from "next/server";
import { backendBaseUrl } from "../../../lib/backend";

// Proxies straight to the backend; deliberately no cookie set here — registering
// doesn't log the caller in on the backend, that's a separate POST /api/auth/login.
export async function POST(req: NextRequest) {
  const body = await req.json();

  const backendRes = await fetch(`${backendBaseUrl()}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}
