"use client";

import React, { useState, useEffect } from "react";
import { 
  Terminal, Folder, FolderOpen, FileText, Plus, Edit2, Trash2, 
  Copy, Star, Settings, History, Download, User2, ChevronRight, 
  ChevronDown, Search, FolderPlus, Globe, Move, ChevronLeft
} from "lucide-react";
import { Folder as FolderType, SavedRequest } from "@/lib/storage";

interface SidebarProps {
  folders: FolderType[];
  requests: SavedRequest[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectRequest: (req: SavedRequest) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onCreateRequestInFolder: (folderId: string | null) => void;
  onDeleteRequest: (id: string) => void;
  onDuplicateRequest: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onMoveRequest: (requestId: string, folderId: string | null) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  folders,
  requests,
  activeTab,
  setActiveTab,
  onSelectRequest,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateRequestInFolder,
  onDeleteRequest,
  onDuplicateRequest,
  onToggleFavorite,
  onMoveRequest,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [agentConnected, setAgentConnected] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals / Dialog states
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState<"create" | "rename">("create");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderParentId, setFolderParentId] = useState<string | null>(null);

  // Move request modal
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [requestToMove, setRequestToMove] = useState<SavedRequest | null>(null);

  // Auto-fetch agent connection status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/agent/status");
        const data = await res.json();
        setAgentConnected(!!data.connected);
      } catch {
        setAgentConnected(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleCreateFolderClick = (parentId: string | null = null) => {
    setFolderModalMode("create");
    setFolderParentId(parentId);
    setFolderName("");
    setShowFolderModal(true);
  };

  const handleRenameFolderClick = (folderId: string, currentName: string) => {
    setFolderModalMode("rename");
    setActiveFolderId(folderId);
    setFolderName(currentName);
    setShowFolderModal(true);
  };

  const handleFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    if (folderModalMode === "create") {
      onCreateFolder(folderName.trim(), folderParentId);
    } else if (folderModalMode === "rename" && activeFolderId) {
      onRenameFolder(activeFolderId, folderName.trim());
    }

    setShowFolderModal(false);
    setFolderName("");
  };

  const handleMoveClick = (req: SavedRequest) => {
    setRequestToMove(req);
    setShowMoveModal(true);
  };

  // Build Folder hierarchy mapping
  // returns roots and mapping of folderId -> subfolders
  const getFolderTree = () => {
    const roots: FolderType[] = [];
    const childrenMap: Record<string, FolderType[]> = {};

    folders.forEach((f) => {
      if (!f.parentId) {
        roots.push(f);
      } else {
        if (!childrenMap[f.parentId]) {
          childrenMap[f.parentId] = [];
        }
        childrenMap[f.parentId].push(f);
      }
    });

    return { roots, childrenMap };
  };

  const { roots: rootFolders, childrenMap } = getFolderTree();

  // Filter requests based on search query
  const filteredRequests = requests.filter((r) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query) ||
      r.curl.toLowerCase().includes(query) ||
      r.tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  const getRequestsForFolder = (folderId: string | null) => {
    return filteredRequests.filter((r) => r.folderId === folderId);
  };

  // Recursive folder renderer
  const renderFolderNode = (folder: FolderType, depth: number = 0) => {
    const isExpanded = !!expandedFolders[folder.id];
    const subfolders = childrenMap[folder.id] || [];
    const folderRequests = getRequestsForFolder(folder.id);
    const hasChildren = subfolders.length > 0 || folderRequests.length > 0;

    return (
      <div key={folder.id} className="select-none" style={{ marginLeft: `${depth * 8}px` }}>
        {/* Folder row */}
        <div 
          className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-zinc-900 transition text-sm text-zinc-300 hover:text-white cursor-pointer"
          onClick={() => toggleFolder(folder.id)}
        >
          <div className="flex items-center space-x-2 truncate">
            <span className="text-zinc-500">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <span className="text-indigo-400">
              {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
            </span>
            <span className="font-medium truncate">{folder.name}</span>
          </div>

          {/* Folder action controls */}
          <div className="hidden group-hover:flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => handleCreateFolderClick(folder.id)} 
              title="New Subfolder"
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-indigo-400"
            >
              <FolderPlus size={12} />
            </button>
            <button 
              onClick={() => onCreateRequestInFolder(folder.id)} 
              title="New Saved Request"
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-indigo-400"
            >
              <Plus size={12} />
            </button>
            <button 
              onClick={() => handleRenameFolderClick(folder.id, folder.name)} 
              title="Rename Folder"
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-amber-400"
            >
              <Edit2 size={12} />
            </button>
            <button 
              onClick={() => onDeleteFolder(folder.id)} 
              title="Delete Folder"
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Subfolders and requests */}
        {isExpanded && (
          <div className="mt-0.5 border-l border-zinc-800 ml-3.5 pl-2 space-y-0.5">
            {subfolders.map((sub) => renderFolderNode(sub, depth + 1))}
            {folderRequests.map((req) => renderRequestNode(req))}
            {(!hasChildren) && (
              <div className="text-xs text-zinc-600 italic py-1 pl-6">Empty Folder</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Saved Request node renderer
  const renderRequestNode = (req: SavedRequest) => {
    const isGet = req.parsedRequest?.method === "GET";
    const isPost = req.parsedRequest?.method === "POST";
    const isPut = req.parsedRequest?.method === "PUT";
    const isDelete = req.parsedRequest?.method === "DELETE";

    const methodColor = isGet 
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
      : isPost 
      ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
      : isPut
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
      : isDelete
      ? "text-red-400 bg-red-500/10 border-red-500/20"
      : "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";

    return (
      <div 
        key={req.id}
        onClick={() => {
          onSelectRequest(req);
          setActiveTab("playground");
        }}
        className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-zinc-900/60 cursor-pointer text-xs transition border border-transparent hover:border-zinc-800/40"
      >
        <div className="flex items-center space-x-2 truncate w-full">
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${methodColor}`}>
            {req.parsedRequest?.method || "GET"}
          </span>
          <span 
            className="font-medium text-zinc-300 truncate group-hover:text-white"
            title={req.title === "New cURL Request" ? (req.parsedRequest?.url || req.title) : req.title}
          >
            {req.title === "New cURL Request" ? (req.parsedRequest?.url || req.title) : req.title}
          </span>
          {req.favorite && (
            <Star size={11} className="fill-amber-400 text-amber-400 flex-shrink-0" />
          )}
        </div>

        {/* Saved request actions */}
        <div className="hidden group-hover:flex items-center space-x-0.5 ml-2" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => onToggleFavorite(req.id)}
            title={req.favorite ? "Unfavorite" : "Favorite"}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-amber-400"
          >
            <Star size={11} className={req.favorite ? "fill-amber-400 text-amber-400" : ""} />
          </button>
          <button 
            onClick={() => handleMoveClick(req)}
            title="Move Folder"
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-indigo-400"
          >
            <Move size={11} />
          </button>
          <button 
            onClick={() => onDuplicateRequest(req.id)}
            title="Duplicate"
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-indigo-400"
          >
            <Copy size={11} />
          </button>
          <button 
            onClick={() => onDeleteRequest(req.id)}
            title="Delete Request"
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-400"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    );
  };

  const navItems = [
    { id: "playground", label: "Playground", icon: Terminal },
    { id: "history", label: "History", icon: History },
    { id: "backup", label: "Import / Export", icon: Download },
    { id: "profile", label: "Profile", icon: User2 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
          onClick={onToggleCollapse}
        />
      )}
      <div 
        className={`transition-all duration-300 ease-in-out bg-zinc-950 border-r border-zinc-800 flex flex-col h-[100dvh] select-none absolute md:relative z-50 md:z-auto ${
          isCollapsed ? "-translate-x-full md:translate-x-0 w-0 overflow-hidden border-r-0" : "translate-x-0 w-[85%] max-w-sm md:w-80"
        }`} 
        id="dashboard-sidebar"
      >
        <div className="flex flex-col h-full w-full min-w-[320px]">
          {/* Brand */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-1.5 rounded-md text-white">
            <Terminal size={16} />
          </div>
          <span className="font-bold text-sm tracking-wider bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            CURLLAB
          </span>
        </div>

        {/* Action Controls & Collapse Button */}
        <div className="flex items-center space-x-2">
          {/* Agent Badge */}
          <div className="flex items-center space-x-1.5 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
            <div className={`w-1.5 h-1.5 rounded-full ${agentConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-zinc-400">
              {agentConnected ? "Live" : "Offline"}
            </span>
          </div>

          <button
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
            className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-zinc-800"
          >
            <ChevronLeft size={15} />
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="p-3 border-b border-zinc-800 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition font-medium ${
                isActive 
                  ? "bg-zinc-800 text-zinc-50 border border-zinc-750" 
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
              }`}
              id={`sidebar-nav-${item.id}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Explorer Section */}
      <div className="flex-grow flex flex-col overflow-hidden">
        <div className="p-3 border-b border-zinc-800 flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-zinc-500">
              Workspace Explorer
            </span>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => handleCreateFolderClick(null)}
                title="Create Folder"
                className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white"
                id="create-folder-btn"
              >
                <FolderPlus size={14} />
              </button>
              <button 
                onClick={() => onCreateRequestInFolder(null)}
                title="Create Saved Request"
                className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white"
                id="create-request-btn"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-zinc-600">
              <Search size={13} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search collections..."
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Tree List Scrollable Area */}
        <div className="flex-grow overflow-y-auto p-3 space-y-1">
          {/* Render Folders Tree */}
          {rootFolders.map((root) => renderFolderNode(root))}

          {/* Render Root Level Requests (without folder) */}
          {getRequestsForFolder(null).length > 0 && (
            <div className="pt-2 border-t border-zinc-800/60 mt-2 space-y-0.5">
              <div className="px-2 py-1 text-[10px] uppercase font-mono text-zinc-500 font-bold tracking-wider">
                Unsorted Requests
              </div>
              {getRequestsForFolder(null).map((req) => renderRequestNode(req))}
            </div>
          )}

          {folders.length === 0 && requests.length === 0 && (
            <div className="text-xs text-zinc-600 text-center py-8">
              No collections found. Click the + icons to start organizing!
            </div>
          )}
        </div>
      </div>

      {/* Active User Section Footer */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 text-xs text-zinc-500 flex items-center space-x-2.5">
        <div className="bg-zinc-900 p-2 rounded-full text-indigo-400">
          <Globe size={14} />
        </div>
        <div className="truncate flex-grow">
          <div className="font-medium text-zinc-300">CurlLab Client</div>
          <div className="text-[10px] text-zinc-500 font-mono">v1.0.0 (Standalone)</div>
        </div>
      </div>

      {/* MODAL: Create / Rename Folder */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4" id="folder-modal-backdrop">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-4">
              {folderModalMode === "create" ? "Create New Folder" : "Rename Folder"}
            </h3>
            <form onSubmit={handleFolderSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-zinc-500 mb-1.5">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g., Stripe Payments"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Move Request */}
      {showMoveModal && requestToMove && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4" id="move-modal-backdrop">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-3 truncate">
              Move &quot;{requestToMove.title}&quot;
            </h3>
            <p className="text-[11px] text-zinc-400 mb-4">
              Select the destination folder for this request.
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto mb-4 border border-zinc-800/40 rounded p-1">
              <button
                onClick={() => {
                  onMoveRequest(requestToMove.id, null);
                  setShowMoveModal(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded hover:bg-zinc-800 text-xs flex items-center space-x-2 ${
                  requestToMove.folderId === null ? "text-indigo-400 bg-zinc-950/40" : "text-zinc-300"
                }`}
              >
                <Folder size={14} className="text-zinc-500" />
                <span>Root Workspace (Unsorted)</span>
              </button>

              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    onMoveRequest(requestToMove.id, f.id);
                    setShowMoveModal(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded hover:bg-zinc-800 text-xs flex items-center space-x-2 ${
                    requestToMove.folderId === f.id ? "text-indigo-400 bg-zinc-950/40" : "text-zinc-300"
                  }`}
                >
                  <Folder size={14} className="text-indigo-400" />
                  <span>{f.name}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowMoveModal(false)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
    </>
  );
}
