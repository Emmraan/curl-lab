"use client";

import React, { useState, useEffect } from "react";
import { Download, Terminal, ShieldAlert, Check, Copy, HelpCircle, Laptop } from "lucide-react";

export default function SettingsView() {
  const [appUrl, setAppUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (typeof window !== "undefined") {
        setAppUrl(window.location.origin);
      }
    });
  }, []);

  const getWsUrl = () => {
    if (!appUrl) return "wss://your-hosted-app.run.app";
    return appUrl.replace(/^http/, "ws");
  };

  const handleCopyCommand = () => {
    const cmd = `node agent.js --url ${getWsUrl()}`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] overflow-y-auto p-4 md:p-6 space-y-6" id="settings-view-container">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <span>Settings & Local Agent Guide</span>
        </h2>
        <p className="text-xs text-zinc-500">
          Configure local connectivity tools and discover how to route localhost API calls.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Info Box */}
        <div className="space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="bg-indigo-600/10 text-indigo-400 p-3 rounded-lg w-fit">
              <Laptop size={24} />
            </div>
            <h3 className="text-sm font-semibold text-white">Why use the Local Agent?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              For security and sandboxing rules, cloud-hosted containers cannot execute requests targeting <code className="text-indigo-400">localhost</code>, <code className="text-indigo-400">127.0.0.1</code>, or internal servers directly on your machine.
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The **Local Agent** runs locally on your machine, listens to execution commands forwarded by this browser via a secure duplex WebSocket link, executes the HTTP requests directly on your localhost, and returns the response safely. No shell script is ever executed!
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Security Safeguards</h4>
            <ul className="space-y-2 text-[11px] text-zinc-400 list-disc pl-4 leading-relaxed">
              <li>Executes HTTP requests only using node-fetch; never spawns child processes.</li>
              <li>Complete SSRF protections block server execution on private cloud domains.</li>
              <li>Strict cookie and header sanitization prevents external data pollution.</li>
            </ul>
          </div>
        </div>

        {/* Action Column */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 space-y-6">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <span>Step-by-Step Launch Guide</span>
          </h3>

          <div className="space-y-4 text-xs text-zinc-300">
            {/* Step 1 */}
            <div className="flex items-start space-x-3">
              <span className="bg-zinc-900 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-400 font-mono">1</span>
              <div>
                <p className="font-semibold text-white">Download Agent Companion</p>
                <p className="text-zinc-500 text-[11px] mt-0.5">Click download below to save the safe, lightweight JavaScript agent code.</p>
                <a
                  href="/agent.js"
                  download="agent.js"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 rounded text-[11px] font-semibold mt-2 transition"
                >
                  <Download size={12} />
                  <span>Download agent.js</span>
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-3">
              <span className="bg-zinc-900 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-400 font-mono">2</span>
              <div>
                <p className="font-semibold text-white">Install WebSockets Package</p>
                <p className="text-zinc-500 text-[11px] mt-0.5">Initialize NPM or install the lightweight WebSocket peer dependency:</p>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800 text-[11px] font-mono mt-1.5 text-zinc-450">
                  npm install ws
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-3">
              <span className="bg-zinc-900 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-400 font-mono">3</span>
              <div>
                <p className="font-semibold text-white">Launch local proxy</p>
                <p className="text-zinc-500 text-[11px] mt-0.5">Run the script pointing back to this exact hosted cloud URL:</p>
                <div className="flex items-center space-x-1.5 mt-2 bg-zinc-950 px-2.5 py-1.5 rounded border border-zinc-800 max-w-full">
                  <span className="font-mono text-[10px] text-indigo-300 truncate select-all flex-grow">
                    node agent.js --url {getWsUrl()}
                  </span>
                  <button
                    onClick={handleCopyCommand}
                    className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded transition"
                    title="Copy command to clipboard"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
