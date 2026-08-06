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

- **Custom server** (`server.js`) — minimal HTTP wrapper around Next.js (plain `next` handler, no WebSocket). Entrypoint for local `pnpm dev` / `pnpm start`; ignored on Vercel, which serves the standard Next.js output.
- **Auth** — simple username/password via `.env` (`APP_USERNAME`, `APP_PASSWORD`, `SESSION_SECRET`). Sessions are HMAC-signed cookies (7-day expiry), DIY without Passport or NextAuth.
- **Data** — all folders, saved requests, and history live in **localStorage** only. No database. First-time users get seed data (GitHub API, Stripe API folders).
- **Request execution** — two paths:
  - **Server-side** (public URLs): SSRF-protected via DNS resolution + private IP blocklist. Max 60s timeout, 5MB response cap.
  - **Browser-direct** (localhost/private URLs): executed in the browser via `fetch(mode: "cors")`, gated by Chrome's Local Network Access permission + the target server's CORS headers. No agent, no WebSocket.
- **Network detection** — `lib/network.ts` holds pure `isLocalhost` / `isPrivateIp` / `isPrivateHostname` helpers (no Node imports) shared by both the server SSRF checks and client-side routing.

## Key file layout

| Path | Purpose |
|---|---|
| `server.js` | Custom HTTP server entrypoint (plain Next handler, no WebSocket) |
| `app/api/execute/route.ts` | Request execution endpoint (public URLs only) |
| `app/api/auth/*/route.ts` | Login/logout/session check |
| `lib/parser.ts` | cURL command tokenizer + parser |
| `lib/executor.ts` | Server-side HTTP execution with SSRF protection |
| `lib/network.ts` | Pure localhost/private-IP detection (shared server + client) |
| `lib/storage.ts` | localStorage CRUD for folders, requests, history, backup |
| `lib/session.ts` | Session token create/verify (HMAC + base64) |
| `components/Playground.tsx` | Main request editor + execution UI (browser-direct localhost) |
| `components/Sidebar.tsx` | Folder tree + request list navigation |
| `components/SettingsView.tsx` | Settings + Localhost CORS setup guide |

## Conventions & quirks

- **Path alias** — `@/*` maps to root (e.g. `@/components/Playground`, `@/lib/parser`).
- **No tests** — no test framework, no test files, no CI.
- **TypeScript** — `strict: true`, `ignoreBuildErrors: false`.
- **ESLint** — `eslint.config.mjs` flat config extends `eslint-config-next`. Legacy `.eslintrc.json` also present (redundant).
- **HMR** — disabled when `DISABLE_HMR=true` env is set (Next.js config ignores all file watchers).
- **No Google AI / Gemini** — `@google/genai` dependency was removed. `metadata.json` still exists but is vestigial (leftover from AI Studio scaffolding).
- **`pnpm-lock.yaml`** — commit it, don't edit manually.
