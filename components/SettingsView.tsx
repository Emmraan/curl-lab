"use client";

import React, { useState } from "react";
import { Globe, Laptop, CheckCircle2, XCircle, ChevronDown, ChevronRight, ExternalLink, Settings2, Copy, Check } from "lucide-react";

interface FrameworkGuide {
  name: string;
  category: string;
  ready: boolean;
  description: string;
  snippet?: string;
  note?: string;
}

const FRAMEWORK_GUIDES: FrameworkGuide[] = [
  {
    name: "Vite dev server",
    category: "Node.js",
    ready: true,
    description: "Already sends Access-Control-Allow-Origin: * by default. Nothing to do.",
  },
  {
    name: "JSON-server",
    category: "Node.js",
    ready: true,
    description: "CORS is enabled out of the box. Nothing to do.",
  },
  {
    name: "Express",
    category: "Node.js",
    ready: false,
    description: "Install the cors middleware and enable it on your app.",
    snippet: `npm install cors\n\nconst cors = require("cors");\napp.use(cors()); // allow all origins\n\n// or restrict:\n// app.use(cors({ origin: "https://curl-lab-eight.vercel.app" }));`,
  },
  {
    name: "Plain Node http server",
    category: "Node.js",
    ready: false,
    description: "Add the CORS header manually to every response.",
    snippet: `res.setHeader("Access-Control-Allow-Origin", "*");\nres.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");\nres.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");`,
  },
  {
    name: "Next.js API route",
    category: "Node.js",
    ready: false,
    description: "Set CORS headers on the API route (or use middleware).",
    snippet: `// app/api/route.ts\nexport async function OPTIONS() {\n  return new Response(null, {\n    headers: {\n      "Access-Control-Allow-Origin": "*",\n      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",\n      "Access-Control-Allow-Headers": "Content-Type, Authorization",\n    },\n  });\n}`,
  },
  {
    name: "Flask",
    category: "Python",
    ready: false,
    description: "Use the flask-cors extension.",
    snippet: `pip install flask-cors\n\nfrom flask import Flask\nfrom flask_cors import CORS\n\napp = Flask(__name__)\nCORS(app)  # allow all origins\n\n# or scoped:\n# CORS(app, origins=["https://curl-lab-eight.vercel.app"])`,
  },
  {
    name: "FastAPI",
    category: "Python",
    ready: false,
    description: "Add the CORSMiddleware to your app.",
    snippet: `from fastapi.middleware.cors import CORSMiddleware\n\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=["*"],\n    allow_methods=["*"],\n    allow_headers=["*"],\n)`,
  },
  {
    name: "Django",
    category: "Python",
    ready: false,
    description: "Use the django-cors-headers package.",
    snippet: `pip install django-cors-headers\n\n# settings.py\nINSTALLED_APPS = [\n    ...,\n    "corsheaders",\n]\n\nMIDDLEWARE = [\n    "corsheaders.middleware.CorsMiddleware",\n    ...,\n]\n\nCORS_ALLOW_ALL_ORIGINS = True  # or set CORS_ALLOWED_ORIGINS`,
  },
  {
    name: "Spring Boot",
    category: "Java",
    ready: false,
    description: "Use @CrossOrigin on the controller or configure globally.",
    snippet: `// Per controller:\n@CrossOrigin\n@RestController\npublic class ApiController { ... }\n\n// Or global:\n@Configuration\npublic class WebConfig implements WebMvcConfigurer {\n  @Override\n  public void addCorsMappings(CorsRegistry registry) {\n    registry.addMapping("/**").allowedOrigins("*");\n  }\n}`,
  },
];

export default function SettingsView() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopySnippet = async (name: string, snippet: string) => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedSnippet(name);
      setTimeout(() => setCopiedSnippet(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const readyFrameworks = FRAMEWORK_GUIDES.filter((f) => f.ready);
  const setupFrameworks = FRAMEWORK_GUIDES.filter((f) => !f.ready);

  return (
    <div className="flex flex-col h-full bg-[#09090b] overflow-y-auto p-4 md:p-6 space-y-6" id="settings-view-container">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Settings2 size={18} className="text-indigo-400" />
          <span>Settings & Localhost Guide</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Localhost requests now run directly in your browser — no agent to download. Set up once and you&apos;re good to go.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column: how it works */}
        <div className="space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="bg-indigo-600/10 text-indigo-400 p-3 rounded-lg w-fit">
              <Globe size={24} />
            </div>
            <h3 className="text-sm font-semibold text-white">How localhost requests work now</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your app is hosted on a cloud server (Vercel), so the server can&apos;t reach your local machine. Instead, the{" "}
              <code className="text-indigo-400">browser itself</code> makes the request directly to{" "}
              <code className="text-indigo-400">localhost</code> or <code className="text-indigo-400">127.0.0.1</code>.
              No downloadable agent, no WebSocket, no extra process.
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="bg-indigo-600/10 text-indigo-400 p-3 rounded-lg w-fit">
              <Laptop size={24} />
            </div>
            <h3 className="text-sm font-semibold text-white">Two quick requirements</h3>
            <ol className="space-y-3 text-xs text-zinc-400 leading-relaxed list-decimal pl-4">
              <li>
                <span className="text-zinc-200 font-medium">Browser permission (Chrome 142+):</span> the first time you
                run a localhost request, Chrome shows{" "}
                <code className="text-indigo-400">&quot;wants to access other apps and services on this device&quot;</code> — click{" "}
                <span className="text-emerald-400 font-medium">Allow</span>. It&apos;s remembered per site.
              </li>
              <li>
                <span className="text-zinc-200 font-medium">CORS on your local server:</span> the local server must send{" "}
                <code className="text-indigo-400">Access-Control-Allow-Origin</code> for the browser to read the
                response. See the framework guide on the right.
              </li>
            </ol>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 space-y-3">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">Limitation</h4>
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              If a local server doesn&apos;t send CORS headers, the browser blocks reading its response — this is a browser
              security rule that cannot be bypassed from the app. Enabling CORS on the target server is the only fix
              (and most dev servers like Vite already send it).
            </p>
          </div>
        </div>

        {/* Right column: setup guide */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 space-y-6">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <span>Step-by-Step Setup</span>
          </h3>

          {/* Step 1: Chrome permission */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="bg-zinc-900 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-400 font-mono">1</span>
              <div className="flex-1">
                <p className="font-semibold text-white">Grant the browser permission</p>
                <p className="text-zinc-500 text-[11px] mt-0.5">
                  Run any localhost request once and click <span className="text-emerald-400">Allow</span> on the
                  prompt. Or pre-allow it in Chrome:
                </p>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800 text-[11px] font-mono mt-1.5 text-zinc-400 select-all">
                  chrome://settings/content/loopbackNetwork
                </div>
                <a
                  href="https://developer.chrome.com/blog/local-network-access"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-[11px] text-indigo-400 hover:text-indigo-300 mt-1.5"
                >
                  <ExternalLink size={11} />
                  <span>Learn more about Local Network Access</span>
                </a>
              </div>
            </div>
          </div>

          {/* Step 2: framework CORS guide */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="bg-zinc-900 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-400 font-mono">2</span>
              <div className="flex-1">
                <p className="font-semibold text-white">Enable CORS on your local server</p>
                <p className="text-zinc-500 text-[11px] mt-0.5">
                  Pick your framework. Servers marked <CheckCircle2 size={11} className="inline text-emerald-400" />{" "}
                  already work — no changes needed.
                </p>
              </div>
            </div>

            {/* Already-ready frameworks */}
            <div className="flex flex-wrap gap-2 pl-7">
              {readyFrameworks.map((fw) => (
                <span
                  key={fw.name}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded text-[11px] font-medium"
                  title={fw.description}
                >
                  <CheckCircle2 size={11} />
                  <span>{fw.name}</span>
                </span>
              ))}
            </div>

            {/* Frameworks needing setup */}
            <div className="space-y-2 pl-7">
              {setupFrameworks.map((fw) => {
                const isOpen = expanded === fw.name;
                return (
                  <div
                    key={fw.name}
                    className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/40"
                  >
                    <button
                      onClick={() => setExpanded(isOpen ? null : fw.name)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-zinc-900/50 transition"
                    >
                      <div className="flex items-center space-x-2">
                        {isOpen ? (
                          <ChevronDown size={13} className="text-zinc-500" />
                        ) : (
                          <ChevronRight size={13} className="text-zinc-500" />
                        )}
                        <span className="text-xs font-medium text-zinc-200">{fw.name}</span>
                        <span className="text-[10px] text-zinc-600">{fw.category}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[10px] font-medium">
                          <XCircle size={10} />
                          <span>Setup needed</span>
                        </span>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 space-y-2">
                        <p className="text-[11px] text-zinc-500 leading-relaxed">{fw.description}</p>
                        {fw.snippet && (
                          <div className="relative">
                            <pre className="bg-zinc-950 border border-zinc-800 rounded p-2.5 text-[10px] font-mono text-zinc-300 overflow-x-auto whitespace-pre">
                              {fw.snippet}
                            </pre>
                            <button
                              onClick={() => handleCopySnippet(fw.name, fw.snippet!)}
                              className="absolute top-1.5 right-1.5 p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition"
                              title="Copy snippet"
                            >
                              {copiedSnippet === fw.name ? (
                                <Check size={11} className="text-emerald-400" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
