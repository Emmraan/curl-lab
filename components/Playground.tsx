"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

import { 
  Play, RotateCcw, AlignLeft, Save, ShieldAlert, CheckCircle, 
  Clock, HardDrive, Copy, Check, Download, AlertCircle, Eye, EyeOff
} from "lucide-react";
import { parseCurl } from "@/lib/parser";
import { isPrivateHostname } from "@/lib/network";
import { SavedRequest } from "@/lib/storage";

interface PlaygroundProps {
  selectedRequest: SavedRequest | null;
  onSaveRequest: (title: string, description: string, curl: string, parsed: any, tags: string[]) => void;
  onUpdateSavedRequest: (id: string, curl: string, parsed: any) => void;
  onAddHistory: (curl: string, method: string, url: string, status: number, time: number, size: number) => void;
  onNavigate: (tab: "playground" | "history" | "backup" | "profile" | "settings") => void;
}

export default function Playground({
  selectedRequest,
  onSaveRequest,
  onUpdateSavedRequest,
  onAddHistory,
  onNavigate,
}: PlaygroundProps) {
  const [curlInput, setCurlInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [activeResTab, setActiveResTab] = useState<"body" | "headers" | "raw">("body");
  const [copied, setCopied] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  // Save Request Form States
  const [saveTitle, setSaveTitle] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [saveTagsString, setSaveTagsString] = useState("");

  const [showParserInfo, setShowParserInfo] = useState(true);

  // Split Pane dragging logic (cURL Input vs Response Panel)
  const [responseHeight, setResponseHeight] = useState(256);
  const [isDragging, setIsDragging] = useState(false);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById("playground-container");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newHeight = rect.bottom - e.clientY - 24;
      if (newHeight > 100 && newHeight < rect.height - 200) {
        setResponseHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Sync with selected request
  useEffect(() => {
    Promise.resolve().then(() => {
      if (selectedRequest) {
        setCurlInput(selectedRequest.curl);
        setParsed(selectedRequest.parsedRequest);
        setResponse(null); // clear previous response
      } else {
        // Default placeholder cURL to let them run something immediately!
        const defaultCurl = "curl https://api.github.com/users/octocat";
        setCurlInput(defaultCurl);
        setParsed(parseCurl(defaultCurl));
      }
    });
  }, [selectedRequest]);

  // Live parsing with debounce for performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (curlInput.trim()) {
        try {
          const parsedResult = parseCurl(curlInput);
          setParsed(parsedResult);
        } catch (err) {
          // keep old parsed state or ignore incomplete typing
        }
      } else {
        setParsed(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [curlInput]);

  const handleClear = () => {
    setCurlInput("");
    setParsed(null);
    setResponse(null);
  };

  const handleFormat = () => {
    if (!curlInput.trim()) return;
    // Clean up multiline first
    const cleaned = curlInput.replace(/\\\s*\n/g, " ").replace(/\s+/g, " ").trim();
    // Split key params into newlines
    const tokens = cleaned.split(" ");
    let formatted = tokens[0]; // 'curl'
    
    for (let i = 1; i < tokens.length; i++) {
      const t = tokens[i];
      if (t === "-H" || t === "--header" || t === "-d" || t === "--data" || t === "--data-raw" || t === "--data-binary" || t === "-u" || t === "--user" || t === "-X" || t === "--request" || t === "-F" || t === "--form") {
        formatted += " \\\n  " + t;
      } else {
        formatted += " " + t;
      }
    }
    setCurlInput(formatted);
  };

  // Browser-direct execution for localhost/private targets.
  // Mirrors the old Local Agent logic but runs entirely in the browser,
  // so no downloadable companion process is needed.
  const executeFromBrowser = async (parsedReq: any): Promise<any> => {
    const { method, url, headers, body, multipart, timeout = 30000 } = parsedReq;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.min(timeout, 60000));

    const requestHeaders: Record<string, string> = { ...headers };
    delete requestHeaders["host"];
    delete requestHeaders["content-length"];

    let requestBody: any = body;

    if (multipart && multipart.length > 0) {
      const formData = new FormData();
      multipart.forEach(({ key, value }: { key: string; value: string }) => {
        formData.append(key, value);
      });
      delete requestHeaders["content-type"];
      requestBody = formData;
    }

    const startTime = Date.now();

    try {
      const fetchResponse = await fetch(url, {
        method,
        headers: requestHeaders,
        body: method !== "GET" && method !== "HEAD" ? requestBody : undefined,
        signal: controller.signal,
      });

      const endTime = Date.now();
      const elapsedTime = endTime - startTime;

      const responseText = await fetchResponse.text();
      const responseHeaders: Record<string, string> = {};
      fetchResponse.headers.forEach((val, key) => {
        responseHeaders[key] = val;
      });

      const statusLine = `HTTP/1.1 ${fetchResponse.status} ${fetchResponse.statusText}\r\n`;
      const headersSection = Object.entries(responseHeaders)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\r\n");
      const rawResponse = `${statusLine}${headersSection}\r\n\r\n${responseText}`;

      return {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: responseHeaders,
        body: responseText,
        size: new TextEncoder().encode(responseText).length,
        time: elapsedTime,
        rawResponse,
      };
    } catch (err: any) {
      const endTime = Date.now();
      const message = err.message || "Unknown error";
      const corsBlocked =
        message.includes("Failed to fetch") ||
        message.includes("NetworkError") ||
        message.includes("CORS") ||
        message.includes("blocked");

      return {
        status: 0,
        statusText: corsBlocked ? "CORS Blocked" : "Browser Request Error",
        headers: {},
        body: corsBlocked
          ? `The browser blocked this request to "${url}".\n\nThis usually happens for one of two reasons:\n\n1. The local server does not send CORS headers (Access-Control-Allow-Origin). Add CORS to your local server — see the Localhost Setup Guide in Settings.\n\n2. (Chrome 142+) The "Access other apps and services on this device" permission has not been allowed yet. Grant it once when prompted.`
          : `Browser request failed: ${message}`,
        size: 0,
        time: endTime - startTime,
        rawResponse: `HTTP/1.1 0 ${corsBlocked ? "CORS Blocked" : "Error"}\r\n\r\n${message}`,
        localHint: corsBlocked,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleRun = async () => {
    if (!parsed || !parsed.url) return;
    setLoading(true);
    setResponse(null);

    const isLocal = isPrivateHostname(parsed.url);

    try {
      if (isLocal) {
        // Browser-direct execution for localhost/private targets
        const localResponse = await executeFromBrowser(parsed);
        setResponse(localResponse);
        onAddHistory(
          curlInput,
          parsed.method,
          parsed.url,
          localResponse.status,
          localResponse.time,
          localResponse.size
        );
      } else {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            curl: curlInput,
            parsedRequest: parsed,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setResponse(data.response);
          // Save to execution history
          onAddHistory(
            curlInput,
            parsed.method,
            parsed.url,
            data.response.status,
            data.response.time,
            data.response.size
          );
        } else {
          setResponse({
            status: 0,
            statusText: "Execution Failed",
            headers: {},
            body: data.error || "Execution failed. Server returned an error.",
            size: 0,
            time: 0,
            rawResponse: `HTTP/1.1 0 Error\r\n\r\nError: ${data.error || "Unknown server-side error"}`,
          });
        }
      }
    } catch (err: any) {
      setResponse({
        status: 0,
        statusText: "Network Error",
        headers: {},
        body: err.message || "Failed to dispatch fetch request.",
        size: 0,
        time: 0,
        rawResponse: `HTTP/1.1 0 Local-Fetch-Error\r\n\r\nError: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = () => {
    if (selectedRequest) {
      // Direct update of existing request
      onUpdateSavedRequest(selectedRequest.id, curlInput, parsed);
      alert("Saved request updated successfully!");
    } else {
      // New save modal
      setSaveTitle("");
      setSaveDescription("");
      setSaveTagsString("");
      setShowSaveModal(true);
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;

    const tags = saveTagsString
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    onSaveRequest(saveTitle.trim(), saveDescription.trim(), curlInput, parsed, tags);
    setShowSaveModal(false);
  };

  const handleCopyResponse = () => {
    if (!response) return;
    const content = activeResTab === "body" 
      ? response.body 
      : activeResTab === "headers" 
      ? JSON.stringify(response.headers, null, 2) 
      : response.rawResponse;

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadResponse = () => {
    if (!response) return;
    const element = document.createElement("a");
    const file = new Blob([response.body], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `response_${response.status || "data"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Helper to highlight status code
  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
    if (status >= 300 && status < 400) {
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
    if (status >= 400 && status < 500) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
    return "bg-red-500/10 text-red-400 border-red-500/20";
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#09090b] p-3 md:p-6 space-y-4" id="playground-container">
      {/* Upper Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-4 sm:gap-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Playground</span>
            {selectedRequest && (
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700 truncate max-w-xs font-normal">
                {selectedRequest.title}
              </span>
            )}
          </h2>
          <p className="text-xs text-zinc-500">
            Pristine syntax-highlighted editor to run and manipulate cURL requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleFormat}
            disabled={!curlInput}
            title="Clean & Align multiline backslashes"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs transition disabled:opacity-40"
            id="format-curl-btn"
          >
            <AlignLeft size={14} />
            <span>Format</span>
          </button>
          <button
            onClick={handleClear}
            disabled={!curlInput}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs transition disabled:opacity-40"
            id="clear-curl-btn"
          >
            <RotateCcw size={14} />
            <span>Clear</span>
          </button>
          <button
            onClick={handleSaveClick}
            disabled={!curlInput}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-zinc-200 hover:bg-zinc-700 text-xs transition disabled:opacity-40"
            id="save-curl-btn"
          >
            <Save size={14} />
            <span>{selectedRequest ? "Update Saved" : "Save..."}</span>
          </button>
          <button
            onClick={handleRun}
            disabled={loading || !parsed || !parsed.url}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/15 transition disabled:opacity-40"
            id="run-curl-btn"
          >
            <Play size={14} className="fill-white" />
            <span>{loading ? "Executing..." : "Run"}</span>
          </button>
        </div>
      </div>

      {/* Editor & Parser Info Split */}
      <div className="flex flex-col lg:flex-row flex-grow min-h-0 space-y-4 lg:space-y-0 lg:space-x-4">
        {/* Editor Box */}
        <div className="flex-grow flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden min-h-[250px]">
          <div className="p-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-zinc-400">cURL COMMAND INPUT</span>
            <button
              onClick={() => setShowParserInfo(!showParserInfo)}
              className="text-[10px] text-zinc-500 hover:text-white transition flex items-center space-x-1 uppercase font-mono font-bold"
            >
              {showParserInfo ? <EyeOff size={12} /> : <Eye size={12} />}
              <span>{showParserInfo ? "Hide Parser" : "Show Parser"}</span>
            </button>
          </div>
          
          <div className="flex-grow relative min-h-[180px]">
            {/* Standard Monaco Editor */}
            <Editor
              height="100%"
              defaultLanguage="shell"
              theme="vs-dark"
              value={curlInput}
              onChange={(val) => setCurlInput(val || "")}
              loading={
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-zinc-500 text-xs font-mono">
                  Initializing Syntax Editor...
                </div>
              }
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineHeight: 1.5,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                fontFamily: "var(--font-mono), monospace",
              }}
            />
          </div>
        </div>

        {/* Live Parser Output Inspector */}
        {showParserInfo && (
          <div className="w-full lg:w-80 flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden text-xs">
            <div className="p-3 bg-zinc-950/80 border-b border-zinc-800 font-mono font-bold text-zinc-400">
              LIVE PARSER INSPECTOR
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {parsed ? (
                <>
                  {/* Method & URL */}
                  <div>
                    <div className="text-[10px] uppercase font-mono font-bold text-zinc-500 mb-1">Target Endpoint</div>
                    <div className="p-2.5 bg-zinc-950/60 rounded border border-zinc-800 flex items-start space-x-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-zinc-800 text-indigo-400 border border-zinc-700">
                        {parsed.method}
                      </span>
                      <span className="font-mono text-zinc-200 truncate break-all max-w-[180px]">
                        {parsed.url || "No URL detected"}
                      </span>
                    </div>
                  </div>

                  {/* Headers */}
                  <div>
                    <div className="text-[10px] uppercase font-mono font-bold text-zinc-500 mb-1">
                      Headers ({Object.keys(parsed.headers).length})
                    </div>
                    {Object.keys(parsed.headers).length > 0 ? (
                      <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800 space-y-1 font-mono text-[11px] max-h-28 overflow-y-auto">
                        {Object.entries(parsed.headers).map(([k, v]) => (
                          <div key={k} className="truncate text-zinc-300">
                            <span className="text-indigo-400 font-medium">{k}:</span> {String(v)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-zinc-600 italic py-1">No custom headers parsed</div>
                    )}
                  </div>

                  {/* Request Body */}
                  {parsed.body && (
                    <div>
                      <div className="text-[10px] uppercase font-mono font-bold text-zinc-500 mb-1">Body Payload</div>
                      <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800 font-mono text-[11px] max-h-24 overflow-y-auto break-all text-zinc-300">
                        {parsed.body}
                      </div>
                    </div>
                  )}

                  {/* Multipart Form Data */}
                  {parsed.multipart.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-mono font-bold text-zinc-500 mb-1">
                        Multipart Form ({parsed.multipart.length})
                      </div>
                      <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800 space-y-1 font-mono text-[11px]">
                        {parsed.multipart.map((item: any, i: number) => (
                          <div key={i} className="truncate text-zinc-300">
                            <span className="text-amber-400">{item.key}:</span> {item.value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Miscellaneous */}
                  <div className="pt-2 border-t border-zinc-800 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9px] uppercase font-mono font-bold text-zinc-500">Timeout</div>
                      <div className="font-mono text-zinc-300 text-xs mt-0.5">{parsed.timeout / 1000}s</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-mono font-bold text-zinc-500">Compressed</div>
                      <div className="font-mono text-zinc-300 text-xs mt-0.5">{parsed.compressed ? "Yes" : "No"}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 py-12">
                  <AlertCircle size={24} className="mb-2 text-zinc-700" />
                  <span>Paste cURL command on left to parse structured details.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Resize Handle / Divider */}
      <div 
        onMouseDown={startResize}
        className={`h-2.5 -my-1.5 rounded cursor-ns-resize flex items-center justify-center transition-colors group relative select-none z-10 ${
          isDragging ? "bg-indigo-600/70" : "bg-transparent hover:bg-zinc-800/80"
        }`}
        id="playground-drag-handle"
      >
        <div className={`w-16 h-1 rounded bg-zinc-700 group-hover:bg-indigo-400 transition-colors ${
          isDragging ? "bg-indigo-400" : ""
        }`} />
      </div>

      {/* Response Panel */}
      <div 
        style={{ height: `${responseHeight}px` }}
        className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden flex flex-col flex-shrink-0 relative" 
        id="response-panel"
      >
        <div className="p-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <span className="font-mono font-bold text-zinc-400 uppercase">EXECUTION RESPONSE</span>
            {response && (
              <div className="flex items-center space-x-3.5 border-l border-zinc-800 pl-4 font-mono text-[11px]">
                {/* Status Code */}
                <div className={`px-2 py-0.5 rounded border text-xs font-bold uppercase ${getStatusBadge(response.status)}`}>
                  {response.status} {response.statusText}
                </div>
                {/* Duration */}
                <div className="flex items-center space-x-1 text-zinc-400">
                  <Clock size={12} className="text-zinc-500" />
                  <span>{response.time} ms</span>
                </div>
                {/* Size */}
                <div className="flex items-center space-x-1 text-zinc-400">
                  <HardDrive size={12} className="text-zinc-500" />
                  <span>{formatBytes(response.size)}</span>
                </div>
              </div>
            )}
          </div>

          {response && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyResponse}
                className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded text-[10px] font-medium transition"
              >
                {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                onClick={handleDownloadResponse}
                className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded text-[10px] font-medium transition"
              >
                <Download size={11} />
                <span>Save Response</span>
              </button>
            </div>
          )}
        </div>

        {/* CORS / permission hint for blocked localhost requests */}
        {response?.localHint && (
          <div className="flex items-start space-x-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-[11px]">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <div className="leading-relaxed">
              <span className="font-semibold">The browser blocked this localhost request.</span>{" "}
              Either your local server is missing CORS headers, or the browser permission has not been granted yet.
              <button
                onClick={() => onNavigate("settings")}
                className="ml-1.5 text-amber-200 underline underline-offset-2 hover:text-white"
              >
                Open Localhost Setup Guide
              </button>
            </div>
          </div>
        )}

        {/* Tab Controls */}
        {response ? (
          <div className="flex-grow flex flex-col min-h-0 bg-zinc-950/10">
            <div className="flex bg-zinc-950/40 border-b border-zinc-800 px-3">
              {(["body", "headers", "raw"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveResTab(tab)}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                    activeResTab === tab
                      ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content wrapper */}
            <div className="flex-grow overflow-auto p-4 font-mono text-[11px] leading-relaxed relative">
              {activeResTab === "body" && (
                <div className="w-full h-full">
                  {/* Clean folded read-only Monaco Editor inside body for robust JSON parsing, search and copy */}
                  <Editor
                    height="100%"
                    defaultLanguage={
                      response.headers["content-type"]?.includes("json") ? "json" : "text"
                    }
                    theme="vs-dark"
                    value={
                      response.headers["content-type"]?.includes("json")
                        ? (() => {
                            try {
                              return JSON.stringify(JSON.parse(response.body), null, 2);
                            } catch {
                              return response.body;
                            }
                          })()
                        : response.body
                    }
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      fontFamily: "var(--font-mono), monospace",
                    }}
                  />
                </div>
              )}

              {activeResTab === "headers" && (
                <pre className="text-zinc-350">
                  {JSON.stringify(response.headers, null, 2)}
                </pre>
              )}

              {activeResTab === "raw" && (
                <pre className="text-zinc-350 whitespace-pre-wrap">{response.rawResponse}</pre>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center text-zinc-600">
            <Play size={20} className="mb-2 text-zinc-700" />
            <span>Click &quot;Run&quot; above to execute the request and view the response.</span>
          </div>
        )}
      </div>

      {/* SAVE REQUEST MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4" id="save-request-modal-backdrop">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4">
              Save Request to Workspace
            </h3>
            
            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-zinc-500 mb-1.5">
                  Request Title *
                </label>
                <input
                  type="text"
                  required
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="e.g., Get user checkout details"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-zinc-500 mb-1.5">
                  Description
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Details about what this endpoint executes..."
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-indigo-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-zinc-500 mb-1.5">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={saveTagsString}
                  onChange={(e) => setSaveTagsString(e.target.value)}
                  placeholder="e.g., payments, stripe, production"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
                >
                  Save to Collections
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
