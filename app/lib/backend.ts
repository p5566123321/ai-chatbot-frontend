import { cookies } from "next/headers";

export const AUTH_COOKIE = "access_token";

export function backendBaseUrl(): string {
  return process.env.BACKEND_BASE_URL ?? "http://localhost:8080";
}

// Reads the access-token cookie (server-side only) and returns it as a spreadable
// Authorization header, or {} if the caller isn't logged in — the backend's own 401
// handling (SecurityConfig's authenticationEntryPoint) is what actually enforces auth,
// this just forwards whatever token we have.
export async function authHeader(): Promise<Record<string, string>> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Thin fetch wrapper for proxying to the backend with the caller's token attached.
export async function backendFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`${backendBaseUrl()}${path}`, {
    ...init,
    headers: { ...(await authHeader()), ...init?.headers },
  });
}
