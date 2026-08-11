import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "../../../lib/backend";

// No backend call — ADR-007 is access-token-only with no server-side revocation, so
// "logging out" is purely discarding the cookie on this side.
export async function POST() {
  (await cookies()).set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
