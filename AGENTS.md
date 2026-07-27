# AGENTS.md — CurlLab

## Quick start

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # NODE_ENV=production next build
pnpm lint       # ESLint
pnpm clean      # next clean
```

Package manager is **pnpm** (`packageManager` field in `package.json`).

## Architecture

- **Custom server** (`server.js`) — wraps Next.js with a WebSocket server on `/api/ws`. This is the entrypoint, not `next dev`.
- **Auth** — simple username/password via `.env` (`APP_USERNAME`, `APP_PASSWORD`, `SESSION_SECRET`). Sessions are HMAC-signed cookies (7-day expiry), DIY without Passport or NextAuth.
- **Data** — all folders, saved requests, and history live in **localStorage** only. No database. First-time users get seed data (GitHub API, Stripe API folders).
- **Request execution** — two paths:
  - **Server-side** (public URLs): SSRF-protected via DNS resolution + private IP blocklist. Max 60s timeout, 5MB response cap.
  - **Local Agent** (localhost/private URLs): relays via WebSocket to a standalone Node.js script (`public/agent.js`) that does the actual HTTP call.
- **State** — `global.activeAgentSocket` and `global.pendingRequests` (Map) bridge HTTP API routes with WebSocket agent responses.

## Key file layout

| Path | Purpose |
|---|---|
| `server.js` | Custom HTTP + WS server entrypoint |
| `app/api/execute/route.ts` | Request execution endpoint (server + agent dispatch) |
| `app/api/agent/status/route.ts` | Agent connection status |
| `app/api/auth/*/route.ts` | Login/logout/session check |
| `lib/parser.ts` | cURL command tokenizer + parser |
| `lib/executor.ts` | Server-side HTTP execution with SSRF protection |
| `lib/storage.ts` | localStorage CRUD for folders, requests, history, backup |
| `lib/session.ts` | Session token create/verify (HMAC + base64) |
| `public/agent.js` | Local Agent script (run separately with `node public/agent.js`) |
| `components/Playground.tsx` | Main request editor + execution UI |
| `components/Sidebar.tsx` | Folder tree + request list navigation |

## Conventions & quirks

- **Path alias** — `@/*` maps to root (e.g. `@/components/Playground`, `@/lib/parser`).
- **No tests** — no test framework, no test files, no CI.
- **TypeScript** — `strict: true`, `ignoreBuildErrors: false`.
- **ESLint** — `eslint.config.mjs` flat config extends `eslint-config-next`. Legacy `.eslintrc.json` also present (redundant).
- **HMR** — disabled when `DISABLE_HMR=true` env is set (Next.js config ignores all file watchers).
- **No Google AI / Gemini** — `@google/genai` dependency was removed. `metadata.json` still exists but is vestigial (leftover from AI Studio scaffolding).
- **`pnpm-lock.yaml`** — commit it, don't edit manually.
