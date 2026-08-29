# AI Chatbot — Frontend

A Next.js (App Router) web client for the AI Chatbot backend. It provides a streaming chat UI,
account auth, a RAG document manager, and a per-user Gemini settings page, and talks to the
Spring Boot backend through its own server-side proxy routes.

## Tech stack

- **Next.js 16** (App Router) + **React 19**, TypeScript
- **Tailwind CSS v4** (`@tailwindcss/postcss`, `@tailwindcss/typography`)
- **react-markdown** + `remark-gfm` / `remark-math` / `rehype-katex` for rendering assistant
  replies (GitHub-flavoured Markdown and KaTeX math)
- **pnpm** package manager
- Every page is a client component (`"use client"`); there is no server-rendered data fetching
  in pages — data flows through the proxy routes below.

## Architecture

### Backend-for-frontend proxy

The browser never calls the Spring backend directly. Route handlers under `app/api/**` mirror the
backend's REST surface and forward each request with the caller's token attached:

- `app/lib/backend.ts` — `backendFetch(path, init)` prepends `BACKEND_BASE_URL` and spreads in an
  `Authorization: Bearer <token>` header read from the `access_token` **httpOnly** cookie
  (server-side only).
- `app/api/auth/{login,register,logout}` — call the backend, then set or clear the `access_token`
  cookie. Its `maxAge` is set to the JWT's lifetime so "cookie present" stays equivalent to
  "token not expired".
- Auth is always really enforced by the backend; the frontend only forwards the token and reacts
  to `401`.

### Route protection

`proxy.ts` runs on every non-API page route (`matcher` excludes `/login`, `/register`, `/api`,
`_next`, `favicon.ico`). It does a presence-only check on the `access_token` cookie and redirects
to `/login` when it's missing — purely so an unauthenticated visitor doesn't flash the chat UI.
API routes are excluded (a redirect Response is meaningless to `fetch`); client code funnels every
backend `401` through `handleUnauthorized()` in `app/page.tsx` instead.

### Streaming chat

The chat page (`app/page.tsx`) POSTs to `app/api/conversations/[conversationId]/messages/stream`,
which proxies the backend SSE stream. `app/lib/sse.ts` parses the event stream client-side. The
active `conversationId` is kept in `localStorage`; if the SSE connection drops, the page polls
`.../messages/stream/status` (every 2s) to recover partial progress.

### Internationalisation

Custom lightweight client-side i18n (en / zh, default en) — no `next-intl`, no `[locale]` route
segments:

- `app/lib/i18n/config.ts` — locale list, default, `locale` cookie name
- `app/lib/i18n/messages.ts` — flat dotted keys; `en` is the source of truth, `zh` is
  compile-checked against it
- `app/lib/i18n/I18nProvider.tsx` — `useI18n()` → `{ locale, intlLocale, setLocale, t }`
- `components/LanguageSwitcher.tsx` — EN / 中文 toggle

`RootLayout` reads the `locale` cookie server-side and passes it to the provider, so the initial
render (including `<html lang>`) matches without a hydration flash. Switching writes the cookie;
the next full load is rendered in that language.

**Add UI strings** as a key in *both* `en` and `zh` in `messages.ts` (a missing/misspelled `zh`
key is a compile error). Never hardcode user-facing text in components.

## Pages

| Route | Purpose |
|---|---|
| `/` | Streaming chat — Markdown + math rendering, conversation persisted in `localStorage` |
| `/login`, `/register` | Account auth |
| `/settings` | Per-user Gemini settings: model choice, bring-your-own API key, generation params (temperature / topP / topK / candidateCount / maxOutputTokens / systemInstruction), history window size |
| `/document` | RAG documents — upload, list, delete |

## Getting started

### Prerequisites

- Node.js 22+
- pnpm (`corepack enable`)
- The AI Chatbot backend service running and reachable

### Setup

```bash
pnpm install
cp .env.example .env.local     # then edit if the backend isn't on localhost:8080
pnpm dev
```

Open http://localhost:3000.

### Environment

| Variable | Default | Notes |
|---|---|---|
| `BACKEND_BASE_URL` | `http://localhost:8080` | Base URL the proxy routes forward to |

## Scripts

```bash
pnpm dev       # dev server
pnpm build     # production build (emits .next/standalone)
pnpm start     # serve the production build
pnpm lint      # eslint
```

## Deployment

Multi-stage [`Dockerfile`](Dockerfile) builds with pnpm and ships the Next.js standalone output
(`output: "standalone"` in `next.config.ts`) as a non-root image listening on port 3000. Set
`BACKEND_BASE_URL` at runtime.
