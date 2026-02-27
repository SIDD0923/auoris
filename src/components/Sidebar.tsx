"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { FileNode, fileTree, mockGitChanges, mockExtensions } from "@/lib/mockData";

type SidebarView = "explorer" | "search" | "git" | "extensions";

interface SidebarProps {
  onFileSelect: (file: FileNode, path: string) => void;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return <FileCode size={16} className="text-blue-400" />;
    case "js":
    case "jsx":
      return <FileCode size={16} className="text-yellow-400" />;
    case "css":
    case "scss":
      return <FileType size={16} className="text-pink-400" />;
    case "json":
      return <FileJson size={16} className="text-yellow-300" />;
    case "md":
      return <FileText size={16} className="text-gray-400" />;
    case "svg":
    case "png":
    case "ico":
      return <Image size={16} className="text-green-400" />;
    default:
      return <FileIcon size={16} className="text-gray-400" />;
  }
}

function FileTreeItem({
  node,
  depth,
  onFileSelect,
  parentPath,
}: {
  node: FileNode;
  depth: number;
  onFileSelect: (file: FileNode, path: string) => void;
  parentPath: string;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center w-full px-2 py-[3px] hover:bg-[#2a2d3e] text-[13px] text-[#cccccc] group transition-colors duration-100"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {expanded ? (
            <ChevronDown size={16} className="mr-1 text-[#858585] shrink-0" />
          ) : (
            <ChevronRight size={16} className="mr-1 text-[#858585] shrink-0" />
          )}
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {expanded && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeItem
                key={child.name}
                node={child}
                depth={depth + 1}
                onFileSelect={onFileSelect}
                parentPath={currentPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onFileSelect(node, currentPath)}
      className="flex items-center w-full px-2 py-[3px] hover:bg-[#2a2d3e] text-[13px] text-[#cccccc] transition-colors duration-100"
      style={{ paddingLeft: `${depth * 16 + 24}px` }}
    >
      <span className="mr-2 shrink-0">{getFileIcon(node.name)}</span>
      <span className="truncate">{node.name}</span>
    </button>
  );
}

function ExplorerView({ onFileSelect }: { onFileSelect: (file: FileNode, path: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase">
          Explorer
        </span>
      </div>
      <div className="px-0">
        <div className="mb-1">
          <div className="flex items-center px-2 py-1 text-[11px] font-semibold tracking-wide text-[#cccccc] uppercase bg-[#252837] cursor-pointer hover:bg-[#2a2d3e]">
            <ChevronDown size={14} className="mr-1" />
            AURIS-IDE
          </div>
          {fileTree.map((node) => (
            <FileTreeItem
              key={node.name}
              node={node}
              depth={0}
              onFileSelect={onFileSelect}
              parentPath=""
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchView() {
  const [query, setQuery] = useState("");
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
          placeholder="Search"
          className="w-full bg-[#1e1e2e] border border-[#3c3f52] rounded px-3 py-[6px] text-[13px] text-[#cccccc] placeholder-[#686868] focus:outline-none focus:border-[#007fd4] transition-colors"
        />
        <input
          type="text"
          placeholder="Replace"
          className="w-full bg-[#1e1e2e] border border-[#3c3f52] rounded px-3 py-[6px] text-[13px] text-[#cccccc] placeholder-[#686868] focus:outline-none focus:border-[#007fd4] transition-colors"
        />
        <input
          type="text"
          placeholder="files to include"
          className="w-full bg-[#1e1e2e] border border-[#3c3f52] rounded px-3 py-[6px] text-[13px] text-[#cccccc] placeholder-[#686868] focus:outline-none focus:border-[#007fd4] transition-colors"
        />
        {query && (
          <div className="mt-3 text-[12px] text-[#858585]">
            <p>3 results in 2 files</p>
            <div className="mt-2 space-y-1">
              <div className="text-[#e8ab6a]">src/components/App.tsx</div>
              <div className="pl-4 py-[2px] hover:bg-[#2a2d3e] cursor-pointer text-[#cccccc]">
                Line 5: import {`{ ${query} }`} from &apos;./utils&apos;;
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
              <span className="text-[#cccccc] truncate">{change.file.split("/").pop()}</span>
              <span
                className={`text-[11px] font-bold ml-2 shrink-0 ${
                  change.status === "modified"
                    ? "text-[#e2b93d]"
                    : change.status === "added"
                    ? "text-[#73c991]"
                    : "text-[#f14c4c]"
                }`}
              >
                {change.status === "modified" ? "M" : change.status === "added" ? "U" : "D"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
                <div className="text-[13px] text-[#e0e0e0] font-medium truncate">{ext.name}</div>
                <div className="text-[11px] text-[#858585] truncate">{ext.description}</div>
                <div className="text-[11px] text-[#686868] mt-[2px]">{ext.publisher}</div>
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

export default function Sidebar({ onFileSelect }: SidebarProps) {
  const [activeView, setActiveView] = useState<SidebarView>("explorer");
  const [collapsed, setCollapsed] = useState(false);

  const icons: { view: SidebarView; icon: React.ReactNode; label: string }[] = [
    { view: "explorer", icon: <Files size={24} />, label: "Explorer" },
    { view: "search", icon: <Search size={24} />, label: "Search" },
    { view: "git", icon: <GitBranch size={24} />, label: "Source Control" },
    { view: "extensions", icon: <Puzzle size={24} />, label: "Extensions" },
  ];

  return (
    <div className="flex h-full">
      {/* Activity Bar */}
      <div className="w-12 bg-[#181825] flex flex-col items-center py-2 border-r border-[#2b2d3a] shrink-0">
        {icons.map(({ view, icon, label }) => (
          <button
            key={view}
            onClick={() => {
              if (activeView === view && !collapsed) {
                setCollapsed(true);
              } else {
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
          {activeView === "explorer" && <ExplorerView onFileSelect={onFileSelect} />}
          {activeView === "search" && <SearchView />}
          {activeView === "git" && <GitView />}
          {activeView === "extensions" && <ExtensionsView />}
        </div>
      )}
    </div>
  );
}
