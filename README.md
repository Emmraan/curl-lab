# CurlLab

A web app for parsing, organizing, and executing cURL requests right from your browser. Paste any cURL command, tweak headers/body in a Monaco editor, and run it — either from the server or locally via a WebSocket agent.

![screenshot](https://img.shields.io/badge/status-active-brightgreen)

---

## Features

- **cURL Parser** — paste any `curl` command and have it automatically split into URL, method, headers, and body
- **Monaco Editor** — edit the parsed request with a full-featured code editor
- **Server Execution** — run requests against public URLs directly from the server (SSRF-protected)
- **Local Agent** — run requests against `localhost` or private networks using a lightweight Node.js agent
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
cd curllab

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

To execute requests against `localhost` or private IPs, you need the **Local Agent** running alongside the app.

Open a **second terminal** and run:

```bash
node public/agent.js
```

By default, the agent connects to `ws://localhost:3000`. Once connected, you'll see `"Local Agent connected"` in the CurlLab server logs, and any request targeting `localhost` will be routed through the agent.

---

## Project Structure

```
curllab
├── app/                    # Next.js App Router pages and API routes
│   ├── api/
│   │   ├── agent/status/   # Local Agent connection status endpoint
│   │   ├── auth/           # Login, logout, session check
│   │   └── execute/        # cURL execution endpoint
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Main dashboard page
│   └── globals.css         # Global Tailwind styles
├── components/             # React UI components
│   ├── Playground.tsx      # Main request editor & execution view
│   ├── Sidebar.tsx         # Folder & request navigation
│   ├── HistoryView.tsx     # Execution history
│   ├── BackupView.tsx      # Backup & restore
│   ├── SettingsView.tsx    # App settings
│   ├── ProfileView.tsx     # User profile & logout
│   └── LandingPage.tsx     # Login page
├── lib/                    # Shared utilities
│   ├── parser.ts           # cURL command parser
│   ├── executor.ts         # Server-side HTTP execution (SSRF-safe)
│   ├── storage.ts          # localStorage CRUD for folders/requests/history
│   ├── session.ts          # Session token creation & verification
│   └── utils.ts            # Helper utilities
├── public/
│   └── agent.js            # Local Agent script (runs outside the browser)
├── server.js               # Custom HTTP + WebSocket server
├── .env.example            # Environment variable template
└── package.json
```

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server (Next.js + WebSocket) |
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
- **WebSocket:** [`ws`](https://github.com/websockets/ws)
- **Auth:** HTTP-only session cookies signed with `jose`
- **Package Manager:** [pnpm](https://pnpm.io/)

---

## Security

- **SSRF Protection** — server-side requests are validated: hostnames are resolved and blocked if they map to private/loopback IP ranges
- **Response Size Limit** — responses over 5 MB are rejected
- **Timeout Cap** — server requests time out after 60 seconds max
- **Localhost Isolation** — requests to `localhost` are only executed through the Local Agent, not the server
- **HTTP-Only Cookies** — session tokens are stored in HTTP-only, same-site cookies
