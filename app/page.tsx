"use client";

import React, { useState, useEffect } from "react";
import LandingPage from "@/components/LandingPage";
import Sidebar from "@/components/Sidebar";
import Playground from "@/components/Playground";
import HistoryView from "@/components/HistoryView";
import BackupView from "@/components/BackupView";
import ProfileView from "@/components/ProfileView";
import SettingsView from "@/components/SettingsView";

import { 
  Folder, SavedRequest, HistoryItem,
  loadFolders, loadRequests, loadHistory,
  createFolder, renameFolder, deleteFolder,
  saveRequest, updateSavedRequest, deleteSavedRequest,
  duplicateSavedRequest, toggleFavorite, moveRequestToFolder,
  addToHistory, deleteHistoryItem, clearHistory
} from "@/lib/storage";
import { parseCurl } from "@/lib/parser";
import { ChevronRight } from "lucide-react";

export default function Home() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    let mounted = true;
    const handleResize = () => {
      if (mounted) {
        setSidebarCollapsed(window.innerWidth < 768);
      }
    };
    
    // Initial check on next tick to avoid synchronous setState warning
    setTimeout(handleResize, 0);

    window.addEventListener("resize", handleResize);
    return () => {
      mounted = false;
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Storage states
  const [folders, setFolders] = useState<Folder[]>([]);
  const [requests, setRequests] = useState<SavedRequest[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Navigation state
  const [activeTab, setActiveTab] = useState<"playground" | "history" | "backup" | "profile" | "settings">("playground");
  const [selectedRequest, setSelectedRequest] = useState<SavedRequest | null>(null);

  // 1. Check Authentication state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setAuthenticated(true);
          setUsername(data.username);
        }
      } catch (err) {
        console.error("Auth precheck failed:", err);
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, []);

  // Fire a harmless loopback probe on first visit so Chrome shows the
  // Local Network Access permission prompt up-front instead of mid-request.
  useEffect(() => {
    if (typeof window !== "undefined" && window.isSecureContext) {
      fetch("http://127.0.0.1:1/", { mode: "no-cors" }).catch(() => {});
    }
  }, []);

  const syncLocalStorageData = () => {
    setFolders(loadFolders());
    setRequests(loadRequests());
    setHistory(loadHistory());
  };

  // 2. Load Local Storage state when authenticated
  useEffect(() => {
    Promise.resolve().then(() => {
      if (authenticated) {
        syncLocalStorageData();
      }
    });
  }, [authenticated]);

  const handleLoginSuccess = (usr: string) => {
    setAuthenticated(true);
    setUsername(usr);
  };

  const handleLogoutSuccess = () => {
    setAuthenticated(false);
    setUsername("");
    setSelectedRequest(null);
    setActiveTab("playground");
  };

  // --- Sidebar & Folder operations ---
  const handleCreateFolder = (name: string, parentId: string | null) => {
    createFolder(name, parentId);
    syncLocalStorageData();
  };

  const handleRenameFolder = (id: string, name: string) => {
    renameFolder(id, name);
    syncLocalStorageData();
  };

  const handleDeleteFolder = (id: string) => {
    deleteFolder(id);
    syncLocalStorageData();
  };

  const handleCreateRequestInFolder = (folderId: string | null) => {
    const defaultCurl = "curl https://api.github.com/users/octocat";
    const newReq = saveRequest({
      folderId,
      title: "New cURL Request",
      description: "An unsaved collection query",
      curl: defaultCurl,
      parsedRequest: parseCurl(defaultCurl),
      favorite: false,
      tags: ["draft"],
    });
    syncLocalStorageData();
    setSelectedRequest(newReq);
    setActiveTab("playground");
  };

  const handleDeleteRequest = (id: string) => {
    deleteSavedRequest(id);
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest(null);
    }
    syncLocalStorageData();
  };

  const handleDuplicateRequest = (id: string) => {
    const copy = duplicateSavedRequest(id);
    syncLocalStorageData();
    if (copy) {
      setSelectedRequest(copy);
    }
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    syncLocalStorageData();
  };

  const handleMoveRequest = (requestId: string, folderId: string | null) => {
    moveRequestToFolder(requestId, folderId);
    syncLocalStorageData();
  };

  // --- Playground operations ---
  const handleSavePlaygroundRequest = (
    title: string,
    description: string,
    curl: string,
    parsed: any,
    tags: string[]
  ) => {
    const saved = saveRequest({
      folderId: null,
      title,
      description,
      curl,
      parsedRequest: parsed,
      favorite: false,
      tags,
    });
    syncLocalStorageData();
    setSelectedRequest(saved);
  };

  const handleUpdateSavedRequest = (id: string, curl: string, parsed: any) => {
    updateSavedRequest(id, { curl, parsedRequest: parsed });
    syncLocalStorageData();
  };

  // --- History operations ---
  const handleAddHistory = (
    curl: string,
    method: string,
    url: string,
    status: number,
    time: number,
    size: number
  ) => {
    addToHistory(curl, method, url, status, time, size);
    syncLocalStorageData();
  };

  const handleDeleteHistoryItem = (id: string) => {
    deleteHistoryItem(id);
    syncLocalStorageData();
  };

  const handleClearHistory = () => {
    clearHistory();
    syncLocalStorageData();
  };

  const handleRerunHistory = (curl: string) => {
    // Construct transacting draft request
    const tempReq: SavedRequest = {
      id: `draft-${Math.random().toString(36).substr(2, 9)}`,
      folderId: null,
      title: "Historical Draft",
      description: "Restored query from local logs",
      curl,
      parsedRequest: parseCurl(curl),
      favorite: false,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSelectedRequest(tempReq);
    setActiveTab("playground");
  };

  // 3. Render Loading screen during initial auth validation
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
          Securing Environment...
        </span>
      </div>
    );
  }

  // 4. Public Landing Page
  if (!authenticated) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 5. Protected Full-Stack Dashboard
  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden relative" id="dashboard-root">
      {/* Dynamic Workspace Sidebar */}
      <Sidebar
        folders={folders}
        requests={requests}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as any)}
        onSelectRequest={setSelectedRequest}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onCreateRequestInFolder={handleCreateRequestInFolder}
        onDeleteRequest={handleDeleteRequest}
        onDuplicateRequest={handleDuplicateRequest}
        onToggleFavorite={handleToggleFavorite}
        onMoveRequest={handleMoveRequest}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Floating Toggle Button when Sidebar is Collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          title="Open Workspace Sidebar"
          className="fixed top-4 left-4 z-40 p-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg shadow-xl cursor-pointer hover:border-zinc-700 transition-all flex items-center justify-center"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Primary Workspace View Area */}
      <main className={`flex-grow h-screen min-w-0 overflow-hidden flex flex-col bg-neutral-950 transition-all duration-300 ${
        sidebarCollapsed ? "pl-12" : ""
      }`}>
        {activeTab === "playground" && (
          <Playground
            selectedRequest={selectedRequest}
            onSaveRequest={handleSavePlaygroundRequest}
            onUpdateSavedRequest={handleUpdateSavedRequest}
            onAddHistory={handleAddHistory}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === "history" && (
          <HistoryView
            history={history}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
            onRerunHistory={handleRerunHistory}
          />
        )}

        {activeTab === "backup" && (
          <BackupView onRefreshWorkspace={syncLocalStorageData} />
        )}

        {activeTab === "profile" && (
          <ProfileView username={username} onLogout={handleLogoutSuccess} />
        )}

        {activeTab === "settings" && <SettingsView />}
      </main>
    </div>
  );
}
