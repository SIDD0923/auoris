"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Files,
  Search,
  GitBranch,
  Puzzle,
  ChevronRight,
  ChevronDown,
  FileText,
  FileCode,
  FileJson,
  FileType,
  File as FileIcon,
  Image,
  Settings,
  Package,
  FilePlus,
  FolderPlus,
  Trash2,
  Pencil,
} from "lucide-react";
import { useFileSystem, FileNode } from "@/lib/fileSystem";
import { mockGitChanges, mockExtensions } from "@/lib/mockData";

type SidebarView = "explorer" | "search" | "git" | "extensions";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFileIcon(name: string, size = 16) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return <FileCode size={size} className="text-blue-400" />;
    case "js":
    case "jsx":
      return <FileCode size={size} className="text-yellow-400" />;
    case "py":
      return <FileCode size={size} className="text-green-400" />;
    case "css":
    case "scss":
      return <FileType size={size} className="text-pink-400" />;
    case "json":
      return <FileJson size={size} className="text-yellow-300" />;
    case "md":
      return <FileText size={size} className="text-gray-400" />;
    case "svg":
    case "png":
    case "ico":
      return <Image size={size} className="text-green-400" />;
    default:
      return <FileIcon size={size} className="text-gray-400" />;
  }
}

// ─── Inline name input ───────────────────────────────────────────────────────

function InlineInput({
  initialValue,
  onConfirm,
  onCancel,
}: {
  initialValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const trimmed = value.trim();
      if (trimmed) onConfirm(trimmed);
      else onCancel();
    }
    if (e.key === "Escape") onCancel();
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        const trimmed = value.trim();
        if (trimmed && trimmed !== initialValue) onConfirm(trimmed);
        else onCancel();
      }}
      className="bg-[#1e1e2e] border border-[#007fd4] rounded px-1 py-0 text-[13px] text-[#cccccc] outline-none w-full"
    />
  );
}

// ─── File tree item ──────────────────────────────────────────────────────────

function FileTreeItem({
  node,
  depth,
  parentPath,
}: {
  node: FileNode;
  depth: number;
  parentPath: string;
}) {
  const { openFile, deleteNode, renameNode, createFile, createFolder } =
    useFileSystem();
  const [expanded, setExpanded] = useState(depth < 2);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContext = () => setContextMenu(null);

  useEffect(() => {
    if (contextMenu) {
      const handler = () => closeContext();
      window.addEventListener("click", handler);
      return () => window.removeEventListener("click", handler);
    }
  }, [contextMenu]);

  const handleDelete = () => {
    closeContext();
    deleteNode(currentPath);
  };

  const handleRename = (newName: string) => {
    if (newName !== node.name) renameNode(currentPath, newName);
    setIsRenaming(false);
  };

  const handleNewFile = (name: string) => {
    createFile(currentPath, name);
    setIsCreatingFile(false);
    setExpanded(true);
  };

  const handleNewFolder = (name: string) => {
    createFolder(currentPath, name);
    setIsCreatingFolder(false);
    setExpanded(true);
  };

  // ── Folder ─────────────────────────────────────────────────────────────
  if (node.type === "folder") {
    return (
      <div>
        <div
          onContextMenu={handleContextMenu}
          onClick={() => setExpanded(!expanded)}
          className="flex items-center w-full px-2 py-[3px] hover:bg-[#2a2d3e] text-[13px] text-[#cccccc] group cursor-pointer transition-colors duration-100"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {expanded ? (
            <ChevronDown size={16} className="mr-1 text-[#858585] shrink-0" />
          ) : (
            <ChevronRight
              size={16}
              className="mr-1 text-[#858585] shrink-0"
            />
          )}
          {isRenaming ? (
            <InlineInput
              initialValue={node.name}
              onConfirm={handleRename}
              onCancel={() => setIsRenaming(false)}
            />
          ) : (
            <span className="truncate font-medium flex-1">{node.name}</span>
          )}
          {!isRenaming && (
            <div className="hidden group-hover:flex items-center gap-0.5 ml-auto shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreatingFile(true);
                  setExpanded(true);
                }}
                className="p-0.5 hover:bg-[#3c3f52] rounded"
                title="New File"
              >
                <FilePlus size={14} className="text-[#858585]" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreatingFolder(true);
                  setExpanded(true);
                }}
                className="p-0.5 hover:bg-[#3c3f52] rounded"
                title="New Folder"
              >
                <FolderPlus size={14} className="text-[#858585]" />
              </button>
            </div>
          )}
        </div>

        {expanded && (
          <div>
            {isCreatingFile && (
              <div
                className="flex items-center px-2 py-[3px]"
                style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}
              >
                <FileIcon
                  size={16}
                  className="text-gray-400 mr-2 shrink-0"
                />
                <InlineInput
                  initialValue=""
                  onConfirm={handleNewFile}
                  onCancel={() => setIsCreatingFile(false)}
                />
              </div>
            )}
            {isCreatingFolder && (
              <div
                className="flex items-center px-2 py-[3px]"
                style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
              >
                <ChevronRight
                  size={16}
                  className="mr-1 text-[#858585] shrink-0"
                />
                <InlineInput
                  initialValue=""
                  onConfirm={handleNewFolder}
                  onCancel={() => setIsCreatingFolder(false)}
                />
              </div>
            )}
            {node.children?.map((child) => (
              <FileTreeItem
                key={child.name}
                node={child}
                depth={depth + 1}
                parentPath={currentPath}
              />
            ))}
          </div>
        )}

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={[
              {
                label: "New File",
                icon: <FilePlus size={14} />,
                action: () => {
                  closeContext();
                  setIsCreatingFile(true);
                  setExpanded(true);
                },
              },
              {
                label: "New Folder",
                icon: <FolderPlus size={14} />,
                action: () => {
                  closeContext();
                  setIsCreatingFolder(true);
                  setExpanded(true);
                },
              },
              { label: "divider" },
              {
                label: "Rename",
                icon: <Pencil size={14} />,
                action: () => {
                  closeContext();
                  setIsRenaming(true);
                },
              },
              {
                label: "Delete",
                icon: <Trash2 size={14} />,
                action: handleDelete,
                danger: true,
              },
            ]}
          />
        )}
      </div>
    );
  }

  // ── File ───────────────────────────────────────────────────────────────
  return (
    <div>
      <div
        onContextMenu={handleContextMenu}
        onClick={() => openFile(currentPath)}
        className="flex items-center w-full px-2 py-[3px] hover:bg-[#2a2d3e] text-[13px] text-[#cccccc] cursor-pointer group transition-colors duration-100"
        style={{ paddingLeft: `${depth * 16 + 24}px` }}
      >
        <span className="mr-2 shrink-0">{getFileIcon(node.name)}</span>
        {isRenaming ? (
          <InlineInput
            initialValue={node.name}
            onConfirm={handleRename}
            onCancel={() => setIsRenaming(false)}
          />
        ) : (
          <span className="truncate flex-1">{node.name}</span>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            {
              label: "Rename",
              icon: <Pencil size={14} />,
              action: () => {
                closeContext();
                setIsRenaming(true);
              },
            },
            {
              label: "Delete",
              icon: <Trash2 size={14} />,
              action: handleDelete,
              danger: true,
            },
          ]}
        />
      )}
    </div>
  );
}

// ─── Context Menu ────────────────────────────────────────────────────────────

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  action?: () => void;
  danger?: boolean;
}

function ContextMenu({
  x,
  y,
  items,
}: {
  x: number;
  y: number;
  items: ContextMenuItem[];
}) {
  return (
    <div
      className="fixed z-[100] min-w-[160px] py-1 bg-[#252837] border border-[#3c3f52] rounded-lg shadow-xl shadow-black/40"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) =>
        item.label === "divider" ? (
          <div key={i} className="h-px bg-[#3c3f52] my-1" />
        ) : (
          <button
            key={i}
            onClick={item.action}
            className={`flex items-center gap-2 w-full px-3 py-1.5 text-[13px] transition-colors ${
              item.danger
                ? "text-[#f14c4c] hover:bg-[#f14c4c]/10"
                : "text-[#cccccc] hover:bg-[#2a2d3e]"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

// ─── Explorer View ───────────────────────────────────────────────────────────

function ExplorerView() {
  const { fileTree, createFile, createFolder } = useFileSystem();
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCreatingFile(true)}
            className="p-1 hover:bg-[#2a2d3e] rounded transition-colors"
            title="New File"
          >
            <FilePlus size={14} className="text-[#858585]" />
          </button>
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="p-1 hover:bg-[#2a2d3e] rounded transition-colors"
            title="New Folder"
          >
            <FolderPlus size={14} className="text-[#858585]" />
          </button>
        </div>
      </div>
      <div className="px-0">
        <div className="mb-1">
          <div className="flex items-center px-2 py-1 text-[11px] font-semibold tracking-wide text-[#cccccc] uppercase bg-[#252837] cursor-pointer hover:bg-[#2a2d3e]">
            <ChevronDown size={14} className="mr-1" />
            AURIS-IDE
          </div>
          {isCreatingFile && (
            <div
              className="flex items-center px-2 py-[3px]"
              style={{ paddingLeft: "32px" }}
            >
              <FileIcon
                size={16}
                className="text-gray-400 mr-2 shrink-0"
              />
              <InlineInput
                initialValue=""
                onConfirm={(name) => {
                  createFile("", name);
                  setIsCreatingFile(false);
                }}
                onCancel={() => setIsCreatingFile(false)}
              />
            </div>
          )}
          {isCreatingFolder && (
            <div
              className="flex items-center px-2 py-[3px]"
              style={{ paddingLeft: "16px" }}
            >
              <ChevronRight
                size={16}
                className="mr-1 text-[#858585] shrink-0"
              />
              <InlineInput
                initialValue=""
                onConfirm={(name) => {
                  createFolder("", name);
                  setIsCreatingFolder(false);
                }}
                onCancel={() => setIsCreatingFolder(false)}
              />
            </div>
          )}
          {fileTree.map((node) => (
            <FileTreeItem
              key={node.name}
              node={node}
              depth={0}
              parentPath=""
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Search View ─────────────────────────────────────────────────────────────

function SearchView() {
  const { fileTree, openFile } = useFileSystem();
  const [query, setQuery] = useState("");

  const results: { path: string; line: number; text: string }[] = [];
  if (query.trim().length >= 2) {
    const searchTree = (nodes: FileNode[], prefix: string) => {
      for (const node of nodes) {
        const path = prefix ? `${prefix}/${node.name}` : node.name;
        if (node.type === "file" && node.content) {
          const lines = node.content.split("\n");
          lines.forEach((line, i) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              results.push({ path, line: i + 1, text: line.trim() });
            }
          });
        }
        if (node.type === "folder" && node.children) {
          searchTree(node.children, path);
        }
      }
    };
    searchTree(fileTree, "");
  }

  return (
    <div>
      <div className="px-4 py-2">
        <span className="text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase">
          Search
        </span>
      </div>
      <div className="px-3 space-y-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search across files..."
          className="w-full bg-[#1e1e2e] border border-[#3c3f52] rounded px-3 py-[6px] text-[13px] text-[#cccccc] placeholder-[#686868] focus:outline-none focus:border-[#007fd4] transition-colors"
        />
        {query.trim().length >= 2 && (
          <div className="mt-2 text-[12px] text-[#858585]">
            <p>
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </p>
            <div className="mt-2 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
              {results.slice(0, 100).map((r, i) => (
                <div
                  key={i}
                  onClick={() => openFile(r.path)}
                  className="py-[2px] px-1 hover:bg-[#2a2d3e] cursor-pointer rounded"
                >
                  <div className="text-[#e8ab6a] text-[11px]">
                    {r.path}:{r.line}
                  </div>
                  <div className="text-[#cccccc] text-[12px] truncate pl-2">
                    {r.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Git View ────────────────────────────────────────────────────────────────

function GitView() {
  return (
    <div>
      <div className="px-4 py-2">
        <span className="text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase">
          Source Control
        </span>
      </div>
      <div className="px-3">
        <input
          type="text"
          placeholder="Message (Ctrl+Enter to commit)"
          className="w-full bg-[#1e1e2e] border border-[#3c3f52] rounded px-3 py-[6px] text-[13px] text-[#cccccc] placeholder-[#686868] focus:outline-none focus:border-[#007fd4] transition-colors mb-3"
        />
        <div className="text-[11px] font-semibold text-[#bbbbbb] uppercase tracking-wide mb-1">
          Changes ({mockGitChanges.length})
        </div>
        <div className="space-y-[2px]">
          {mockGitChanges.map((change) => (
            <div
              key={change.file}
              className="flex items-center justify-between px-2 py-[3px] hover:bg-[#2a2d3e] rounded cursor-pointer text-[13px]"
            >
              <span className="text-[#cccccc] truncate">
                {change.file.split("/").pop()}
              </span>
              <span
                className={`text-[11px] font-bold ml-2 shrink-0 ${
                  change.status === "modified"
                    ? "text-[#e2b93d]"
                    : change.status === "added"
                    ? "text-[#73c991]"
                    : "text-[#f14c4c]"
                }`}
              >
                {change.status === "modified"
                  ? "M"
                  : change.status === "added"
                  ? "U"
                  : "D"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Extensions View ─────────────────────────────────────────────────────────

function ExtensionsView() {
  const [search, setSearch] = useState("");
  const filtered = mockExtensions.filter((ext) =>
    ext.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <div className="px-4 py-2">
        <span className="text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase">
          Extensions
        </span>
      </div>
      <div className="px-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Extensions in Marketplace"
          className="w-full bg-[#1e1e2e] border border-[#3c3f52] rounded px-3 py-[6px] text-[13px] text-[#cccccc] placeholder-[#686868] focus:outline-none focus:border-[#007fd4] transition-colors mb-3"
        />
        <div className="space-y-1">
          {filtered.map((ext) => (
            <div
              key={ext.name}
              className="flex items-start gap-3 p-2 hover:bg-[#2a2d3e] rounded cursor-pointer"
            >
              <div className="w-8 h-8 rounded bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {ext.name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] text-[#e0e0e0] font-medium truncate">
                  {ext.name}
                </div>
                <div className="text-[11px] text-[#858585] truncate">
                  {ext.description}
                </div>
                <div className="text-[11px] text-[#686868] mt-[2px]">
                  {ext.publisher}
                </div>
              </div>
              {ext.installed && (
                <span className="text-[10px] text-[#73c991] border border-[#73c991]/30 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                  Installed
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Sidebar ────────────────────────────────────────────────────────────

export default function Sidebar() {
  const [activeView, setActiveView] = useState<SidebarView>("explorer");
  const [collapsed, setCollapsed] = useState(false);

  const icons: {
    view: SidebarView;
    icon: React.ReactNode;
    label: string;
  }[] = [
    { view: "explorer", icon: <Files size={24} />, label: "Explorer" },
    { view: "search", icon: <Search size={24} />, label: "Search" },
    {
      view: "git",
      icon: <GitBranch size={24} />,
      label: "Source Control",
    },
    {
      view: "extensions",
      icon: <Puzzle size={24} />,
      label: "Extensions",
    },
  ];

  return (
    <div className="flex h-full">
      {/* Activity Bar */}
      <div className="w-12 bg-[#181825] flex flex-col items-center py-2 border-r border-[#2b2d3a] shrink-0">
        {icons.map(({ view, icon, label }) => (
          <button
            key={view}
            onClick={() => {
              if (activeView === view && !collapsed) setCollapsed(true);
              else {
                setActiveView(view);
                setCollapsed(false);
              }
            }}
            title={label}
            className={`w-12 h-12 flex items-center justify-center transition-all duration-150 relative ${
              activeView === view && !collapsed
                ? "text-white"
                : "text-[#858585] hover:text-white"
            }`}
          >
            {activeView === view && !collapsed && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-white rounded-r" />
            )}
            {icon}
          </button>
        ))}
        <div className="flex-1" />
        <button className="w-12 h-12 flex items-center justify-center text-[#858585] hover:text-white transition-colors">
          <Package size={24} />
        </button>
        <button className="w-12 h-12 flex items-center justify-center text-[#858585] hover:text-white transition-colors">
          <Settings size={24} />
        </button>
      </div>

      {/* Side Panel */}
      {!collapsed && (
        <div className="w-64 bg-[#1e1f2e] border-r border-[#2b2d3a] overflow-y-auto overflow-x-hidden custom-scrollbar">
          {activeView === "explorer" && <ExplorerView />}
          {activeView === "search" && <SearchView />}
          {activeView === "git" && <GitView />}
          {activeView === "extensions" && <ExtensionsView />}
        </div>
      )}
    </div>
  );
}
