# curl-lab

A web app for parsing, organizing, and executing cURL requests right from your browser. Paste any cURL command, tweak headers/body in a Monaco editor, and run it — public URLs from the server, or `localhost`/private URLs directly from your browser.

![screenshot](https://img.shields.io/badge/status-active-brightgreen)

---

## Features

- **cURL Parser** — paste any `curl` command and have it automatically split into URL, method, headers, and body
- **Monaco Editor** — edit the parsed request with a full-featured code editor
- **Server Execution** — run requests against public URLs directly from the server (SSRF-protected)
- **Direct Localhost** — run requests against `localhost` or private networks directly from the browser (no agent to download)
- **Request History** — every execution is logged with status, timing, and response size
- **Saved Requests** — organize requests into folders, mark favorites, add tags
- **Backup & Restore** — export and import your saved requests as JSON
- **Simple Auth** — username/password login with HTTP-only session cookies

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or later)
- [pnpm](https://pnpm.io/) (or npm if you prefer)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/Emmraan/curl-lab.git
cd curl-lab

# 2. Install dependencies
pnpm install

# 3. Create your environment file
cp .env.example .env
```

Open `.env` and set your credentials:

```
APP_USERNAME=admin
APP_PASSWORD=your_password
SESSION_SECRET=your-random-secret-here
```

### Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the credentials you set in `.env`.

---

## Running Requests Against Localhost

Localhost requests are executed **directly in your browser** — no downloadable agent, WebSocket, or extra process needed. When you run a request targeting `localhost`, `127.0.0.1`, or a private LAN address, CurlLab's browser sends the request straight to that address.

Two things must be in place for this to work:

1. **Browser permission (Chrome 142+):** the first time you run a localhost request, Chrome shows a Local Network Access prompt — *"wants to access other apps and services on this device"*. Click **Allow** (it's remembered per site). You can also pre-allow it at `chrome://settings/content/loopbackNetwork`.

2. **CORS on the target server:** the browser can only read the response if the local server sends an `Access-Control-Allow-Origin` header. Many dev servers already do (Vite, JSON-server, `cors()`-enabled Express). For others, see the in-app **Localhost Setup Guide** (Settings → Localhost Guide) for copy-paste setup snippets for Express, Plain Node, Next.js, Flask, FastAPI, Django, and Spring Boot.

> **Limitation:** if a local server doesn't send CORS headers, the browser blocks reading its response — this is a browser security rule that can't be bypassed from the app. Enabling CORS on the target is the only fix.

---

## Project Structure

```
curl-lab
├── app/                    # Next.js App Router pages and API routes
│   ├── api/
│   │   ├── auth/           # Login, logout, session check
│   │   └── execute/        # cURL execution endpoint (public URLs)
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Main dashboard page
│   └── globals.css         # Global Tailwind styles
├── components/             # React UI components
│   ├── Playground.tsx      # Main request editor & execution view
│   ├── Sidebar.tsx         # Folder & request navigation
│   ├── HistoryView.tsx     # Execution history
│   ├── BackupView.tsx      # Backup & restore
│   ├── SettingsView.tsx    # App settings + Localhost CORS guide
│   ├── ProfileView.tsx     # User profile & logout
│   └── LandingPage.tsx     # Login page
├── lib/                    # Shared utilities
│   ├── parser.ts           # cURL command parser
│   ├── executor.ts         # Server-side HTTP execution (SSRF-safe)
│   ├── network.ts          # Pure localhost/private-IP detection (browser-safe)
│   ├── storage.ts          # localStorage CRUD for folders/requests/history
│   ├── session.ts          # Session token creation & verification
│   └── utils.ts            # Helper utilities
├── server.js               # Minimal custom HTTP server wrapper
├── .env.example            # Environment variable template
└── package.json
```

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Build for production |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint across the codebase |

---

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **UI:** [React 19](https://react.dev/) + [Tailwind CSS 4](https://tailwindcss.com/)
- **Editor:** [Monaco Editor](https://microsoft.github.io/monaco-editor/) (via `@monaco-editor/react`)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Animations:** [Motion](https://motion.dev/)
- **Auth:** HTTP-only session cookies signed with `jose`
- **Package Manager:** [pnpm](https://pnpm.io/)

---

## Security

- **SSRF Protection** — server-side requests are validated: hostnames are resolved and blocked if they map to private/loopback IP ranges
- **Response Size Limit** — responses over 5 MB are rejected
- **Timeout Cap** — server requests time out after 60 seconds max
- **Browser-Enforced Localhost Isolation** — requests to `localhost`/private networks run directly in the browser, where CORS + Local Network Access permission keep them under the browser's security model; they never touch the server
- **HTTP-Only Cookies** — session tokens are stored in HTTP-only, same-site cookies
