"use client";

import React, { useState } from "react";
import { HistoryItem } from "@/lib/storage";
import { Trash2, Play, Search, AlertCircle, Clock, HardDrive, Calendar } from "lucide-react";

interface HistoryViewProps {
  history: HistoryItem[];
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  onRerunHistory: (curl: string) => void;
}

export default function HistoryView({
  history,
  onDeleteHistoryItem,
  onClearHistory,
  onRerunHistory,
}: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = history.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.curl.toLowerCase().includes(q) ||
      item.url.toLowerCase().includes(q) ||
      item.method.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: number) => {
    if (status === 0) return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    if (status >= 200 && status < 300) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (status >= 300 && status < 400) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (status >= 400 && status < 500) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-red-500/10 text-red-400 border-red-500/20";
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] p-4 md:p-6 space-y-6" id="history-view-container">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Execution History</span>
          </h2>
          <p className="text-xs text-zinc-500">
            Automatically track and re-run previously executed local and public curl commands.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 text-xs transition"
            id="clear-all-history-btn"
          >
            <Trash2 size={13} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      {history.length > 0 && (
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-600">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history by method, URL, or command text..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/40 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-600"
          />
        </div>
      )}

      {/* Logs List scrollable */}
      <div className="flex-grow overflow-y-auto space-y-3 pr-1">
        {filteredHistory.map((item) => {
          const isGet = item.method === "GET";
          const isPost = item.method === "POST";
          const methodBadge = isGet 
            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
            : isPost 
            ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
            : "text-amber-400 bg-amber-500/10 border-amber-500/20";

          return (
            <div
              key={item.id}
              className="group bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700/80 p-4 rounded-xl flex items-center justify-between space-x-4 transition"
            >
              <div className="flex-grow min-w-0 space-y-2">
                {/* Method, Status, Meta details */}
                <div className="flex flex-wrap items-center gap-2.5 font-mono text-[10px]">
                  <span className={`px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${methodBadge}`}>
                    {item.method}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded border font-semibold ${getStatusBadge(item.status)}`}>
                    {item.status || "Agent Err"}
                  </span>
                  <span className="flex items-center space-x-1 text-zinc-500">
                    <Calendar size={11} />
                    <span>{formatDate(item.timestamp)} {formatTime(item.timestamp)}</span>
                  </span>
                  <span className="flex items-center space-x-1 text-zinc-500">
                    <Clock size={11} />
                    <span>{item.time} ms</span>
                  </span>
                  <span className="flex items-center space-x-1 text-zinc-500">
                    <HardDrive size={11} />
                    <span>{formatBytes(item.responseSize)}</span>
                  </span>
                </div>

                {/* URL and cURL Snippet preview */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-zinc-200 truncate font-mono select-all">
                    {item.url}
                  </div>
                  <div className="p-2 bg-zinc-950/80 rounded border border-zinc-800/60 text-[10px] font-mono text-zinc-400 truncate max-w-full">
                    {item.curl}
                  </div>
                </div>
              </div>

              {/* Run & Delete Controls */}
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  onClick={() => onRerunHistory(item.curl)}
                  title="Re-run in playground"
                  className="p-2 bg-zinc-800 border border-zinc-700 text-indigo-400 hover:bg-zinc-700 hover:text-indigo-300 rounded-lg transition"
                >
                  <Play size={14} className="fill-indigo-400" />
                </button>
                <button
                  onClick={() => onDeleteHistoryItem(item.id)}
                  title="Delete Log"
                  className="p-2 bg-zinc-900 border border-zinc-850 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 py-16">
            <AlertCircle size={28} className="mb-2 text-zinc-700" />
            <span>
              {history.length === 0 
                ? "No executed requests recorded yet. Try running commands!" 
                : "No matching history logs found."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
