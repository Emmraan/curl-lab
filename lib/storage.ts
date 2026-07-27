export interface SavedRequest {
  id: string;
  folderId: string | null; // null means root
  title: string;
  description: string;
  curl: string;
  parsedRequest: any;
  favorite: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  parentId: string | null; // supports nested folders
  name: string;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  curl: string;
  method: string;
  url: string;
  status: number;
  time: number;
  responseSize: number;
}

export interface WorkspaceBackup {
  folders: Folder[];
  requests: SavedRequest[];
  favorites: string[]; // ids of favorite requests
  tags: string[];
  settings: Record<string, any>;
}

const STORAGE_KEYS = {
  FOLDERS: "curllab_folders",
  REQUESTS: "curllab_requests",
  HISTORY: "curllab_history",
};

// Safe access for SSR
const isBrowser = typeof window !== "undefined";

function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  if (!isBrowser) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalStorageItem<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Storage error:", err);
  }
}

// Default initial folders and requests to make the app ready-to-use instantly!
const DEFAULT_FOLDERS: Folder[] = [
  { id: "github-api", parentId: null, name: "GitHub API", createdAt: Date.now() },
  { id: "stripe-api", parentId: null, name: "Stripe API", createdAt: Date.now() },
  { id: "internal-api", parentId: null, name: "Internal APIs", createdAt: Date.now() },
];

const DEFAULT_REQUESTS: SavedRequest[] = [
  {
    id: "req-1",
    folderId: "github-api",
    title: "Get GitHub User Info",
    description: "Fetches public profile data for user octocat from GitHub API",
    curl: "curl https://api.github.com/users/octocat",
    parsedRequest: {
      method: "GET",
      url: "https://api.github.com/users/octocat",
      headers: {},
      body: "",
      multipart: [],
      cookies: "",
      timeout: 30000,
      compressed: false,
    },
    favorite: true,
    tags: ["github", "public"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "req-2",
    folderId: "stripe-api",
    title: "Create a Mock Payment",
    description: "Post a payment request body",
    curl: "curl -X POST https://api.stripe.com/v1/charges \\\n  -u sk_test_key: \\\n  -d amount=2000 \\\n  -d currency=usd",
    parsedRequest: {
      method: "POST",
      url: "https://api.stripe.com/v1/charges",
      headers: { "Authorization": "Basic c2tfdGVzdF9rZXk6" },
      body: "amount=2000&currency=usd",
      multipart: [],
      cookies: "",
      timeout: 30000,
      compressed: false,
    },
    favorite: false,
    tags: ["stripe", "payment"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
];

export function loadFolders(): Folder[] {
  const folders = getLocalStorageItem<Folder[]>(STORAGE_KEYS.FOLDERS, []);
  if (folders.length === 0 && isBrowser) {
    // Seed default folders
    setLocalStorageItem(STORAGE_KEYS.FOLDERS, DEFAULT_FOLDERS);
    return DEFAULT_FOLDERS;
  }
  return folders;
}

export function saveFolders(folders: Folder[]): void {
  setLocalStorageItem(STORAGE_KEYS.FOLDERS, folders);
}

export function loadRequests(): SavedRequest[] {
  const requests = getLocalStorageItem<SavedRequest[]>(STORAGE_KEYS.REQUESTS, []);
  if (requests.length === 0 && isBrowser) {
    // Seed default requests
    setLocalStorageItem(STORAGE_KEYS.REQUESTS, DEFAULT_REQUESTS);
    return DEFAULT_REQUESTS;
  }
  return requests;
}

export function saveRequests(requests: SavedRequest[]): void {
  setLocalStorageItem(STORAGE_KEYS.REQUESTS, requests);
}

export function loadHistory(): HistoryItem[] {
  return getLocalStorageItem<HistoryItem[]>(STORAGE_KEYS.HISTORY, []);
}

export function saveHistory(history: HistoryItem[]): void {
  setLocalStorageItem(STORAGE_KEYS.HISTORY, history);
}

// --- Folder API ---
export function createFolder(name: string, parentId: string | null = null): Folder {
  const folders = loadFolders();
  const newFolder: Folder = {
    id: `folder-${Math.random().toString(36).substr(2, 9)}`,
    parentId,
    name,
    createdAt: Date.now(),
  };
  folders.push(newFolder);
  saveFolders(folders);
  return newFolder;
}

export function renameFolder(id: string, newName: string): Folder | null {
  const folders = loadFolders();
  const folder = folders.find((f) => f.id === id);
  if (folder) {
    folder.name = newName;
    saveFolders(folders);
    return folder;
  }
  return null;
}

export function deleteFolder(id: string): void {
  let folders = loadFolders();
  let requests = loadRequests();

  // Recursively find child folder IDs
  const getSubfolderIds = (folderId: string): string[] => {
    let ids = [folderId];
    folders.forEach((f) => {
      if (f.parentId === folderId) {
        ids = [...ids, ...getSubfolderIds(f.id)];
      }
    });
    return ids;
  };

  const folderIdsToDelete = getSubfolderIds(id);

  // Remove folders
  folders = folders.filter((f) => !folderIdsToDelete.includes(f.id));
  saveFolders(folders);

  // Move saved requests inside those folders to Root (null)
  requests = requests.map((req) => {
    if (req.folderId && folderIdsToDelete.includes(req.folderId)) {
      return { ...req, folderId: null };
    }
    return req;
  });
  saveRequests(requests);
}

// --- Request API ---
export function saveRequest(data: Omit<SavedRequest, "id" | "createdAt" | "updatedAt">): SavedRequest {
  const requests = loadRequests();
  const newReq: SavedRequest = {
    ...data,
    id: `req-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  requests.push(newReq);
  saveRequests(requests);
  return newReq;
}

export function updateSavedRequest(id: string, updates: Partial<Omit<SavedRequest, "id" | "createdAt">>): SavedRequest | null {
  const requests = loadRequests();
  const reqIdx = requests.findIndex((r) => r.id === id);
  if (reqIdx !== -1) {
    const updated = {
      ...requests[reqIdx],
      ...updates,
      updatedAt: Date.now(),
    };
    requests[reqIdx] = updated;
    saveRequests(requests);
    return updated;
  }
  return null;
}

export function deleteSavedRequest(id: string): void {
  const requests = loadRequests();
  const filtered = requests.filter((r) => r.id !== id);
  saveRequests(filtered);
}

export function duplicateSavedRequest(id: string): SavedRequest | null {
  const requests = loadRequests();
  const original = requests.find((r) => r.id === id);
  if (original) {
    const copy: SavedRequest = {
      ...original,
      id: `req-${Math.random().toString(36).substr(2, 9)}`,
      title: `${original.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    requests.push(copy);
    saveRequests(requests);
    return copy;
  }
  return null;
}

export function toggleFavorite(id: string): SavedRequest | null {
  const requests = loadRequests();
  const req = requests.find((r) => r.id === id);
  if (req) {
    req.favorite = !req.favorite;
    saveRequests(requests);
    return req;
  }
  return null;
}

export function moveRequestToFolder(requestId: string, folderId: string | null): SavedRequest | null {
  return updateSavedRequest(requestId, { folderId });
}

// --- History API ---
export function addToHistory(curl: string, method: string, url: string, status: number, time: number, responseSize: number): HistoryItem {
  const history = loadHistory();
  const newItem: HistoryItem = {
    id: `history-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    curl,
    method,
    url,
    status,
    time,
    responseSize,
  };
  // Prepend to show most recent first
  const updated = [newItem, ...history].slice(0, 200); // keep max 200 items
  saveHistory(updated);
  return newItem;
}

export function deleteHistoryItem(id: string): void {
  const history = loadHistory();
  saveHistory(history.filter((item) => item.id !== id));
}

export function clearHistory(): void {
  saveHistory([]);
}

// --- Backup (Import / Export) API ---
export function exportWorkspace(): WorkspaceBackup {
  const folders = loadFolders();
  const requests = loadRequests();
  const favorites = requests.filter((r) => r.favorite).map((r) => r.id);
  
  // Extract all unique tags
  const tagsSet = new Set<string>();
  requests.forEach((r) => r.tags.forEach((t) => tagsSet.add(t)));

  return {
    folders,
    requests,
    favorites,
    tags: Array.from(tagsSet),
    settings: {},
  };
}

export interface ImportSummary {
  foldersCount: number;
  requestsCount: number;
  favoritesCount: number;
  tagsCount: number;
}

export function importWorkspace(backupJson: string, mode: "merge" | "replace"): ImportSummary {
  const data = JSON.parse(backupJson) as Partial<WorkspaceBackup>;
  
  // Basic validation
  if (!data || (typeof data !== "object")) {
    throw new Error("Invalid import data. Must be a JSON object.");
  }

  const incomingFolders = Array.isArray(data.folders) ? data.folders : [];
  const incomingRequests = Array.isArray(data.requests) ? data.requests : [];

  // Further items validation
  incomingFolders.forEach((f, i) => {
    if (!f.id || !f.name) throw new Error(`Folder index ${i} is missing required fields (id or name).`);
  });
  incomingRequests.forEach((r, i) => {
    if (!r.id || !r.title || !r.curl) throw new Error(`Request index ${i} is missing required fields (id, title, or curl).`);
  });

  if (mode === "replace") {
    // Overwrite completely
    saveFolders(incomingFolders);
    saveRequests(incomingRequests);
    
    return {
      foldersCount: incomingFolders.length,
      requestsCount: incomingRequests.length,
      favoritesCount: incomingRequests.filter((r) => r.favorite).length,
      tagsCount: Array.from(new Set(incomingRequests.flatMap((r) => r.tags || []))).length,
    };
  } else {
    // Merge
    const existingFolders = loadFolders();
    const existingRequests = loadRequests();

    const existingFolderIds = new Set(existingFolders.map((f) => f.id));
    const foldersToMerge = incomingFolders.filter((f) => !existingFolderIds.has(f.id));
    const mergedFolders = [...existingFolders, ...foldersToMerge];
    saveFolders(mergedFolders);

    const existingRequestIds = new Set(existingRequests.map((r) => r.id));
    const requestsToMerge = incomingRequests.filter((r) => !existingRequestIds.has(r.id));
    const mergedRequests = [...existingRequests, ...requestsToMerge];
    saveRequests(mergedRequests);

    return {
      foldersCount: foldersToMerge.length,
      requestsCount: requestsToMerge.length,
      favoritesCount: requestsToMerge.filter((r) => r.favorite).length,
      tagsCount: Array.from(new Set(requestsToMerge.flatMap((r) => r.tags || []))).length,
    };
  }
}
