"use client";

import React, { useState, useRef } from "react";
import { Download, Upload, ShieldAlert, CheckCircle, Database, RefreshCw, AlertCircle } from "lucide-react";
import { exportWorkspace, importWorkspace, ImportSummary } from "@/lib/storage";

interface BackupViewProps {
  onRefreshWorkspace: () => void;
}

export default function BackupView({ onRefreshWorkspace }: BackupViewProps) {
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [dragActive, setDragActive] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const backup = exportWorkspace();
      const backupStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([backupStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `curllab_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Failed to export workspace: " + err.message);
    }
  };

  const processFile = async (file: File) => {
    setError("");
    setSummary(null);

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setError("Invalid file type. Please upload a structured JSON backup file.");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          // Run import with chosen mode
          const result = importWorkspace(content, importMode);
          setSummary(result);
          onRefreshWorkspace(); // trigger state sync in main app
        } catch (err: any) {
          setError(err.message || "Failed to parse backup JSON. Ensure fields are intact.");
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      setError("File reader error: " + err.message);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] overflow-y-auto p-4 md:p-6 space-y-8" id="backup-view-container">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <span>Import / Export Workspace</span>
        </h2>
        <p className="text-xs text-zinc-500">
          Securely backup and restore all of your folders, requests, favorites, and history locally.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Export Column */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="bg-indigo-600/10 text-indigo-400 p-3 rounded-lg w-fit">
              <Database size={24} />
            </div>
            <h3 className="text-sm font-semibold text-white">Export Local Backup</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Export your entire workspace including nested folders, requests, tag categorizations, and favorites. This file is saved securely on your local disk as a portable JSON backup.
            </p>
          </div>

          <button
            onClick={handleExport}
            className="mt-8 w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/15 flex items-center justify-center space-x-2"
            id="export-workspace-btn"
          >
            <Download size={14} />
            <span>Download Workspace JSON</span>
          </button>
        </div>

        {/* Import Column */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="bg-indigo-600/10 text-indigo-400 p-3 rounded-lg w-fit">
              <Upload size={24} />
            </div>
            <h3 className="text-sm font-semibold text-white">Import Backup File</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Upload a valid workspace backup JSON file. Choose whether to merge with your current folder trees or replace your workspace entirely.
            </p>

            {/* Mode selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setImportMode("merge")}
                className={`py-1.5 rounded-md text-xs font-semibold transition ${
                  importMode === "merge"
                    ? "bg-zinc-800 text-indigo-400 border border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-350"
                }`}
                id="mode-merge-btn"
              >
                Merge Workspace
              </button>
              <button
                type="button"
                onClick={() => setImportMode("replace")}
                className={`py-1.5 rounded-md text-xs font-semibold transition ${
                  importMode === "replace"
                    ? "bg-red-600/15 text-red-400 border border-red-500/25"
                    : "text-zinc-500 hover:text-zinc-350"
                }`}
                id="mode-replace-btn"
              >
                Overwrite Workspace
              </button>
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer flex flex-col items-center justify-center space-y-2 transition ${
              dragActive 
                ? "border-indigo-500 bg-indigo-500/5 text-indigo-400" 
                : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/10 text-zinc-500"
            }`}
            id="drag-drop-zone"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <Upload size={20} className={dragActive ? "text-indigo-400" : "text-zinc-600"} />
            <div className="text-xs font-medium text-zinc-300">
              Drag & drop backup JSON file here, or <span className="text-indigo-400 underline">browse</span>
            </div>
            <div className="text-[10px] text-zinc-650">Only workspace JSON structures are accepted</div>
          </div>
        </div>
      </div>

      {/* Action Notifications & Summary */}
      <div className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex items-start space-x-3">
            <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold">Import Refused:</span> {error}
            </div>
          </div>
        )}

        {summary && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs flex items-start space-x-3">
            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div className="space-y-2 w-full">
              <div>
                <span className="font-semibold">Workspace Restored Successfully ({importMode === "merge" ? "Merged" : "Replaced"})!</span> Here is the backup summary:
              </div>
              
              {/* Summary cards row */}
              <div className="grid grid-cols-4 gap-4 text-center pt-1.5">
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="text-lg font-bold text-white">{summary.foldersCount}</div>
                  <div className="text-[9px] text-zinc-500 uppercase font-mono mt-0.5">Folders</div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="text-lg font-bold text-white">{summary.requestsCount}</div>
                  <div className="text-[9px] text-zinc-500 uppercase font-mono mt-0.5">Requests</div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="text-lg font-bold text-white">{summary.favoritesCount}</div>
                  <div className="text-[9px] text-zinc-500 uppercase font-mono mt-0.5">Favorites</div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="text-lg font-bold text-white">{summary.tagsCount}</div>
                  <div className="text-[9px] text-zinc-500 uppercase font-mono mt-0.5">Tags</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
