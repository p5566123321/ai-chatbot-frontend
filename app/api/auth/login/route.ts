import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, backendBaseUrl } from "../../../lib/backend";

interface AuthResponse {
  token: string;
  expiresAt: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const backendRes = await fetch(`${backendBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!backendRes.ok) {
    // The backend may return an empty body for some failures (e.g. Spring Security's
    // authenticationEntryPoint on a 401), so don't assume backendRes.json() will
    // succeed — fall back to a synthesized error instead of throwing into a 500.
    const data = await backendRes.json().catch(() => ({
      error: `backend error ${backendRes.status}`,
    }));
    return NextResponse.json(data, { status: backendRes.status });
  }

  const { token, expiresAt }: AuthResponse = await backendRes.json();

  const parsedExpiry = Date.parse(expiresAt);
  if (Number.isNaN(parsedExpiry)) {
    console.error(`Backend returned an unparseable expiresAt: ${expiresAt}`);
    return NextResponse.json(
      { error: "backend error: invalid expiresAt" },
      { status: 502 }
    );
  }

  // The raw token is only ever used server-side to set this cookie — it never goes back
  // to the browser's JS. maxAge tracks the backend's own expiry so the cookie can't
  // outlive the JWT it holds.
  const maxAge = Math.max(0, Math.floor((parsedExpiry - Date.now()) / 1000));
  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  return NextResponse.json({ ok: true });
}
