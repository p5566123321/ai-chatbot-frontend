import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "./app/lib/backend";

// Presence-only check, not a signature/expiry check: the cookie's own maxAge (set at
// login, see app/api/auth/login/route.ts) already tracks the JWT's expiry, so "cookie
// present" and "token not yet expired" stay equivalent without needing a JWT verifier
// here at all. Real enforcement always happens at the backend; this is just UX so an
// unauthenticated visitor doesn't briefly see the chat UI before bouncing to /login.
export function proxy(req: NextRequest) {
  const hasToken = req.cookies.has(AUTH_COOKIE);

  if (!hasToken) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Excludes all of /api/** (not just /api/auth): a redirect Response makes no sense for
// a fetch() caller. The proxy routes under app/api/conversations/** rely on the
// backend's own 401 passthrough instead, handled client-side in app/page.tsx.
export const config = {
  matcher: ["/((?!login|register|api|_next|favicon.ico).*)"],
};
