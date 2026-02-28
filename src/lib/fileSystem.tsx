"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  language?: string;
  content?: string;
}

export interface Tab {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;       // current editor buffer
  savedContent: string;  // last-persisted content
}

interface FileSystemContextValue {
  // File tree
  fileTree: FileNode[];
  getFile: (path: string) => FileNode | null;
  updateFileContent: (path: string, content: string) => void;
  createFile: (parentPath: string, name: string, content?: string) => boolean;
  createFolder: (parentPath: string, name: string) => boolean;
  deleteNode: (path: string) => boolean;
  renameNode: (path: string, newName: string) => boolean;

  // Tabs
  tabs: Tab[];
  activeTabId: string | null;
  openFile: (path: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  saveTab: (tabId: string) => void;
  saveActiveTab: () => void;
  isTabModified: (tabId: string) => boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rs: "rust",
    go: "go",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    html: "html",
    css: "css",
    scss: "css",
    json: "json",
    md: "markdown",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    xml: "xml",
    svg: "xml",
    sh: "shell",
    bash: "shell",
    txt: "plaintext",
  };
  return map[ext ?? ""] ?? "plaintext";
}

/** Traverse the tree and find a node at `path` (slash-separated). */
function findNode(tree: FileNode[], path: string): FileNode | null {
  const parts = path.split("/").filter(Boolean);
  let current: FileNode[] = tree;
  let node: FileNode | null = null;

  for (const part of parts) {
    node = current.find((n) => n.name === part) ?? null;
    if (!node) return null;
    if (node.type === "folder" && node.children) {
      current = node.children;
    }
  }
  return node;
}

/** Find parent folder node (returns the children array). */
function findParentChildren(
  tree: FileNode[],
  parentPath: string
): FileNode[] | null {
  if (!parentPath || parentPath === "/") return tree;
  const parent = findNode(tree, parentPath);
  if (!parent || parent.type !== "folder") return null;
  return parent.children ?? null;
}

function deepCloneTree(tree: FileNode[]): FileNode[] {
  return JSON.parse(JSON.stringify(tree));
}

// ─── Default file tree (seed data) ──────────────────────────────────────────

const DEFAULT_TREE: FileNode[] = [
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "components",
        type: "folder",
        children: [
          {
            name: "App.tsx",
            type: "file",
            language: "typescript",
            content: `import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';

export default function App() {
  return (
    <div className="app-container">
      <Header />
      <div className="app-body">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
}`,
          },
          {
            name: "Header.tsx",
            type: "file",
            language: "typescript",
            content: `import React from 'react';

interface HeaderProps {
  title?: string;
  username?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Auris IDE",
  username = "Developer"
}) => {
  return (
    <header className="header">
      <div className="header-left">
        <h1>{title}</h1>
      </div>
      <nav className="header-nav">
        <a href="/dashboard">Dashboard</a>
        <a href="/settings">Settings</a>
      </nav>
      <div className="header-right">
        <span>{username}</span>
      </div>
    </header>
  );
};`,
          },
          {
            name: "Sidebar.tsx",
            type: "file",
            language: "typescript",
            content: `import React, { useState } from 'react';

const menuItems = [
  { icon: '📁', label: 'Explorer', path: '/explorer' },
  { icon: '🔍', label: 'Search', path: '/search' },
  { icon: '🔀', label: 'Source Control', path: '/git' },
  { icon: '🧩', label: 'Extensions', path: '/extensions' },
];

export const Sidebar: React.FC = () => {
  const [active, setActive] = useState(0);

  return (
    <aside className="sidebar">
      {menuItems.map((item, index) => (
        <button
          key={item.path}
          className={\`sidebar-item \${active === index ? 'active' : ''}\`}
          onClick={() => setActive(index)}
        >
          <span className="icon">{item.icon}</span>
          <span className="label">{item.label}</span>
        </button>
      ))}
    </aside>
  );
};`,
          },
        ],
      },
      {
        name: "utils",
        type: "folder",
        children: [
          {
            name: "helpers.ts",
            type: "file",
            language: "typescript",
            content: `export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function classNames(
  ...classes: (string | boolean | undefined)[]
): string {
  return classes.filter(Boolean).join(' ');
}`,
          },
          {
            name: "constants.ts",
            type: "file",
            language: "typescript",
            content: `export const API_BASE_URL = 'https://api.auris.dev/v1';

export const SUPPORTED_LANGUAGES = [
  'typescript', 'javascript', 'python',
  'rust', 'go', 'java', 'html', 'css',
  'json', 'markdown',
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];`,
          },
        ],
      },
      {
        name: "index.ts",
        type: "file",
        language: "typescript",
        content: `export { default as App } from './components/App';
export { Header } from './components/Header';
export { Sidebar } from './components/Sidebar';`,
      },
    ],
  },
  {
    name: "public",
    type: "folder",
    children: [
      {
        name: "favicon.ico",
        type: "file",
        content: "",
      },
    ],
  },
  {
    name: "package.json",
    type: "file",
    language: "json",
    content: `{
  "name": "auris-ide",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@monaco-editor/react": "^4.6.0",
    "lucide-react": "^0.300.0"
  }
}`,
  },
  {
    name: "tsconfig.json",
    type: "file",
    language: "json",
    content: `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}`,
  },
  {
    name: "README.md",
    type: "file",
    language: "markdown",
    content: `# Auris IDE

A modern web-based IDE built with Next.js, React, and Monaco Editor.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`
`,
  },
];

// ─── localStorage keys ───────────────────────────────────────────────────────
const LS_TREE_KEY = "auris-ide-filetree";
const LS_TABS_KEY = "auris-ide-tabs";
const LS_ACTIVE_KEY = "auris-ide-activetab";

function loadTree(): FileNode[] {
  if (typeof window === "undefined") return deepCloneTree(DEFAULT_TREE);
  try {
    const raw = localStorage.getItem(LS_TREE_KEY);
    if (raw) return JSON.parse(raw) as FileNode[];
  } catch {
    /* ignore */
  }
  return deepCloneTree(DEFAULT_TREE);
}

function saveTree(tree: FileNode[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_TREE_KEY, JSON.stringify(tree));
  } catch {
    /* ignore */
  }
}

function loadTabs(): Tab[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_TABS_KEY);
    if (raw) return JSON.parse(raw) as Tab[];
  } catch {
    /* ignore */
  }
  return [];
}

function saveTabs(tabs: Tab[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_TABS_KEY, JSON.stringify(tabs));
  } catch {
    /* ignore */
  }
}

function loadActiveTab(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS_ACTIVE_KEY);
}

function persistActiveTab(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(LS_ACTIVE_KEY, id);
  else localStorage.removeItem(LS_ACTIVE_KEY);
}

// ─── Context ─────────────────────────────────────────────────────────────────

const FileSystemContext = createContext<FileSystemContextValue | null>(null);

export function useFileSystem(): FileSystemContextValue {
  const ctx = useContext(FileSystemContext);
  if (!ctx) throw new Error("useFileSystem must be used within FileSystemProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function FileSystemProvider({ children }: { children: React.ReactNode }) {
  const [tree, setTree] = useState<FileNode[]>(() => loadTree());
  const [tabs, setTabs] = useState<Tab[]>(() => loadTabs());
  const [activeTabId, setActiveTabId] = useState<string | null>(() => loadActiveTab());
  const initialised = useRef(false);

  // Hydrate from localStorage on mount (to avoid SSR mismatch)
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    setTree(loadTree());
    setTabs(loadTabs());
    setActiveTabId(loadActiveTab());
  }, []);

  // Persist on change
  useEffect(() => { saveTree(tree); }, [tree]);
  useEffect(() => { saveTabs(tabs); }, [tabs]);
  useEffect(() => { persistActiveTab(activeTabId); }, [activeTabId]);

  // ── File tree ops ────────────────────────────────────────────────────────

  const getFile = useCallback(
    (path: string): FileNode | null => findNode(tree, path),
    [tree]
  );

  const updateFileContent = useCallback(
    (path: string, content: string) => {
      setTree((prev) => {
        const next = deepCloneTree(prev);
        const node = findNode(next, path);
        if (node && node.type === "file") node.content = content;
        return next;
      });
    },
    []
  );

  const createFile = useCallback(
    (parentPath: string, name: string, content = ""): boolean => {
      let success = false;
      setTree((prev) => {
        const next = deepCloneTree(prev);
        const children = findParentChildren(next, parentPath);
        if (!children) return prev;
        if (children.some((c) => c.name === name)) return prev; // duplicate
        children.push({
          name,
          type: "file",
          language: detectLanguage(name),
          content,
        });
        children.sort((a, b) => {
          if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        success = true;
        return next;
      });
      return success;
    },
    []
  );

  const createFolder = useCallback(
    (parentPath: string, name: string): boolean => {
      let success = false;
      setTree((prev) => {
        const next = deepCloneTree(prev);
        const children = findParentChildren(next, parentPath);
        if (!children) return prev;
        if (children.some((c) => c.name === name)) return prev;
        children.push({ name, type: "folder", children: [] });
        children.sort((a, b) => {
          if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        success = true;
        return next;
      });
      return success;
    },
    []
  );

  const deleteNode = useCallback(
    (path: string): boolean => {
      const parts = path.split("/").filter(Boolean);
      if (parts.length === 0) return false;
      const name = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join("/");
      let success = false;
      setTree((prev) => {
        const next = deepCloneTree(prev);
        const children = findParentChildren(next, parentPath);
        if (!children) return prev;
        const idx = children.findIndex((c) => c.name === name);
        if (idx === -1) return prev;
        children.splice(idx, 1);
        success = true;
        return next;
      });
      // Close tabs for deleted files
      if (success) {
        setTabs((prev) => {
          const updated = prev.filter(
            (t) => t.path !== path && !t.path.startsWith(path + "/")
          );
          if (updated.length !== prev.length && activeTabId) {
            const stillOpen = updated.find((t) => t.id === activeTabId);
            if (!stillOpen) {
              setActiveTabId(updated.length > 0 ? updated[updated.length - 1].id : null);
            }
          }
          return updated;
        });
      }
      return success;
    },
    [activeTabId]
  );

  const renameNode = useCallback(
    (path: string, newName: string): boolean => {
      const parts = path.split("/").filter(Boolean);
      if (parts.length === 0) return false;
      const oldName = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join("/");
      let success = false;
      setTree((prev) => {
        const next = deepCloneTree(prev);
        const children = findParentChildren(next, parentPath);
        if (!children) return prev;
        if (children.some((c) => c.name === newName)) return prev; // duplicate
        const node = children.find((c) => c.name === oldName);
        if (!node) return prev;
        node.name = newName;
        if (node.type === "file") node.language = detectLanguage(newName);
        children.sort((a, b) => {
          if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        success = true;
        return next;
      });
      // Update tabs paths
      if (success) {
        const newPath = parentPath ? `${parentPath}/${newName}` : newName;
        setTabs((prev) =>
          prev.map((t) => {
            if (t.path === path) {
              return { ...t, path: newPath, name: newName, language: detectLanguage(newName) };
            }
            if (t.path.startsWith(path + "/")) {
              const updated = t.path.replace(path, newPath);
              return { ...t, path: updated };
            }
            return t;
          })
        );
      }
      return success;
    },
    []
  );

  // ── Tab ops ──────────────────────────────────────────────────────────────

  const openFile = useCallback(
    (path: string) => {
      // Already open?
      const existing = tabs.find((t) => t.path === path);
      if (existing) {
        setActiveTabId(existing.id);
        return;
      }
      const node = findNode(tree, path);
      if (!node || node.type !== "file") return;
      const content = node.content ?? "";
      const newTab: Tab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: node.name,
        path,
        language: node.language || detectLanguage(node.name),
        content,
        savedContent: content,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
    },
    [tabs, tree]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === tabId);
        const next = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId) {
          const newActive = next[Math.min(idx, next.length - 1)];
          setActiveTabId(newActive?.id ?? null);
        }
        return next;
      });
    },
    [activeTabId]
  );

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, content } : t))
    );
  }, []);

  const saveTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const tab = prev.find((t) => t.id === tabId);
        if (!tab) return prev;
        // Persist to tree
        updateFileContent(tab.path, tab.content);
        return prev.map((t) =>
          t.id === tabId ? { ...t, savedContent: t.content } : t
        );
      });
    },
    [updateFileContent]
  );

  const saveActiveTab = useCallback(() => {
    if (activeTabId) saveTab(activeTabId);
  }, [activeTabId, saveTab]);

  const isTabModified = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      return tab ? tab.content !== tab.savedContent : false;
    },
    [tabs]
  );

  const value: FileSystemContextValue = {
    fileTree: tree,
    getFile,
    updateFileContent,
    createFile,
    createFolder,
    deleteNode,
    renameNode,
    tabs,
    activeTabId,
    openFile,
    closeTab,
    setActiveTab: setActiveTabId,
    updateTabContent,
    saveTab,
    saveActiveTab,
    isTabModified,
  };

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
}
