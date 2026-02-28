"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Terminal,
  AlertTriangle,
  FileOutput,
  X,
  Plus,
  Trash2,
  Maximize2,
  AlertCircle,
  Info,
} from "lucide-react";
import { useFileSystem, FileNode } from "@/lib/fileSystem";
import { mockProblems } from "@/lib/mockData";

type PanelTab = "terminal" | "problems" | "output";

interface BottomPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  height: number;
  onHeightChange: (h: number) => void;
}

// ─── Terminal Entry ──────────────────────────────────────────────────────────

interface TermEntry {
  type: "input" | "output" | "error" | "success";
  text: string;
}

// ─── Terminal View ───────────────────────────────────────────────────────────

function TerminalView() {
  const {
    fileTree,
    createFile,
    createFolder,
    deleteNode,
    getFile,
    openFile,
  } = useFileSystem();

  const [input, setInput] = useState("");
  const [history, setHistory] = useState<TermEntry[]>([
    {
      type: "success",
      text: "Welcome to Auris Terminal v1.0.0\nType 'help' for a list of available commands.\n",
    },
  ]);
  const [cwd, setCwd] = useState("/");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [cmdHistoryIdx, setCmdHistoryIdx] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Convert cwd + relative path to absolute path (no leading /)
  const resolvePath = useCallback(
    (arg: string): string => {
      if (arg.startsWith("/")) return arg.replace(/^\/+/, "");
      const base = cwd === "/" ? [] : cwd.replace(/^\/+/, "").split("/").filter(Boolean);
      const parts = [...base, ...arg.split("/")];
      const resolved: string[] = [];
      for (const p of parts) {
        if (p === "." || p === "") continue;
        if (p === "..") resolved.pop();
        else resolved.push(p);
      }
      return resolved.join("/");
    },
    [cwd]
  );

  // List children at a path
  const listDir = useCallback(
    (path: string): FileNode[] | null => {
      if (!path) return fileTree; // root
      const node = getFile(path);
      if (!node || node.type !== "file") {
        // It's a folder
        if (node?.type === "folder") return node.children ?? [];
      }
      // Check if path resolves to folder
      const parts = path.split("/").filter(Boolean);
      let current: FileNode[] = fileTree;
      for (const part of parts) {
        const found = current.find((n) => n.name === part);
        if (!found) return null;
        if (found.type === "folder") {
          current = found.children ?? [];
        } else {
          return null; // tried to list a file
        }
      }
      return current;
    },
    [fileTree, getFile]
  );

  const executeCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      const pushInput = (text: string) => ({ type: "input" as const, text: `$ ${text}` });
      const pushOutput = (text: string) => ({ type: "output" as const, text });
      const pushError = (text: string) => ({ type: "error" as const, text });
      const pushSuccess = (text: string) => ({ type: "success" as const, text });

      // Parse command
      const tokens = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
      const cmd = tokens[0]?.toLowerCase();
      const args = tokens.slice(1).map((t) => t.replace(/^"|"$/g, ""));

      const entries: TermEntry[] = [pushInput(trimmed)];

      switch (cmd) {
        case "help": {
          entries.push(
            pushOutput(
              [
                "Available commands:",
                "  help            Show this help message",
                "  ls [path]       List directory contents",
                "  cd <path>       Change directory",
                "  pwd             Print working directory",
                "  cat <file>      Display file contents",
                "  touch <file>    Create a new empty file",
                "  mkdir <name>    Create a new directory",
                "  rm <path>       Delete a file or folder",
                "  echo <text>     Print text to terminal",
                "  open <file>     Open a file in the editor",
                "  clear           Clear the terminal",
                "  whoami          Print current user",
                "  date            Print current date",
                "  node -v         Show Node.js version",
                "  npm -v          Show npm version",
                "  uname           Show system info",
                "",
              ].join("\n")
            )
          );
          break;
        }

        case "clear": {
          setHistory([]);
          return;
        }

        case "ls": {
          const target = args[0] ? resolvePath(args[0]) : (cwd === "/" ? "" : cwd.replace(/^\/+/, ""));
          const children = listDir(target);
          if (!children) {
            entries.push(pushError(`ls: cannot access '${args[0] || "."}': No such directory`));
          } else if (children.length === 0) {
            entries.push(pushOutput("(empty)"));
          } else {
            const output = children
              .map((n) => (n.type === "folder" ? `${n.name}/` : n.name))
              .join("  ");
            entries.push(pushOutput(output));
          }
          break;
        }

        case "cd": {
          if (!args[0] || args[0] === "~" || args[0] === "/") {
            setCwd("/");
            entries.push(pushOutput("/"));
          } else {
            const target = resolvePath(args[0]);
            if (!target) {
              setCwd("/");
              entries.push(pushOutput("/"));
            } else {
              const children = listDir(target);
              if (children !== null) {
                setCwd("/" + target);
                entries.push(pushOutput("/" + target));
              } else {
                entries.push(pushError(`cd: no such directory: ${args[0]}`));
              }
            }
          }
          break;
        }

        case "pwd": {
          entries.push(pushOutput(cwd));
          break;
        }

        case "cat": {
          if (!args[0]) {
            entries.push(pushError("cat: missing file operand"));
          } else {
            const path = resolvePath(args[0]);
            const node = getFile(path);
            if (!node || node.type !== "file") {
              entries.push(pushError(`cat: ${args[0]}: No such file`));
            } else {
              entries.push(pushOutput(node.content ?? "(empty file)"));
            }
          }
          break;
        }

        case "touch": {
          if (!args[0]) {
            entries.push(pushError("touch: missing file operand"));
          } else {
            const fullPath = resolvePath(args[0]);
            const parts = fullPath.split("/").filter(Boolean);
            const fileName = parts.pop()!;
            const parentPath = parts.join("/");
            const result = createFile(parentPath, fileName);
            if (result) {
              entries.push(pushSuccess(`Created file: ${args[0]}`));
            } else {
              entries.push(pushError(`touch: cannot create '${args[0]}': File exists or invalid path`));
            }
          }
          break;
        }

        case "mkdir": {
          if (!args[0]) {
            entries.push(pushError("mkdir: missing operand"));
          } else {
            const fullPath = resolvePath(args[0]);
            const parts = fullPath.split("/").filter(Boolean);
            const dirName = parts.pop()!;
            const parentPath = parts.join("/");
            const result = createFolder(parentPath, dirName);
            if (result) {
              entries.push(pushSuccess(`Created directory: ${args[0]}`));
            } else {
              entries.push(pushError(`mkdir: cannot create '${args[0]}': Directory exists or invalid path`));
            }
          }
          break;
        }

        case "rm": {
          if (!args[0]) {
            entries.push(pushError("rm: missing operand"));
          } else {
            const path = resolvePath(args[0]);
            const result = deleteNode(path);
            if (result) {
              entries.push(pushSuccess(`Removed: ${args[0]}`));
            } else {
              entries.push(pushError(`rm: cannot remove '${args[0]}': No such file or directory`));
            }
          }
          break;
        }

        case "open": {
          if (!args[0]) {
            entries.push(pushError("open: missing file operand"));
          } else {
            const path = resolvePath(args[0]);
            const node = getFile(path);
            if (!node || node.type !== "file") {
              entries.push(pushError(`open: ${args[0]}: No such file`));
            } else {
              openFile(path);
              entries.push(pushSuccess(`Opened: ${args[0]}`));
            }
          }
          break;
        }

        case "echo": {
          entries.push(pushOutput(args.join(" ")));
          break;
        }

        case "whoami": {
          entries.push(pushOutput("developer"));
          break;
        }

        case "date": {
          entries.push(pushOutput(new Date().toString()));
          break;
        }

        case "node": {
          if (args[0] === "-v" || args[0] === "--version") {
            entries.push(pushOutput("v20.11.0"));
          } else {
            entries.push(pushError(`node: invalid option '${args[0] || ""}'`));
          }
          break;
        }

        case "npm": {
          if (args[0] === "-v" || args[0] === "--version") {
            entries.push(pushOutput("10.4.0"));
          } else if (args[0] === "install" || args[0] === "i") {
            entries.push(pushOutput("added 0 packages in 0.3s"));
          } else if (args[0] === "run" && args[1] === "dev") {
            entries.push(
              pushOutput(
                "  ▲ Next.js 15.2.4\n  - Local: http://localhost:3000\n\n ✓ Ready in 1.8s"
              )
            );
          } else {
            entries.push(pushError(`npm: unknown command '${args.join(" ")}'`));
          }
          break;
        }

        case "uname": {
          entries.push(pushOutput("AurisOS 1.0.0 x86_64"));
          break;
        }

        default: {
          entries.push(pushError(`command not found: ${cmd}`));
          break;
        }
      }

      setHistory((prev) => [...prev, ...entries]);
    },
    [cwd, resolvePath, listDir, getFile, createFile, createFolder, deleteNode, openFile]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setCmdHistory((prev) => [input, ...prev]);
    setCmdHistoryIdx(-1);
    executeCommand(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIdx = Math.min(cmdHistoryIdx + 1, cmdHistory.length - 1);
      setCmdHistoryIdx(newIdx);
      if (cmdHistory[newIdx]) setInput(cmdHistory[newIdx]);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIdx = Math.max(cmdHistoryIdx - 1, -1);
      setCmdHistoryIdx(newIdx);
      setInput(newIdx >= 0 ? cmdHistory[newIdx] : "");
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      onClick={() => inputRef.current?.focus()}
    >
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-[13px] leading-relaxed custom-scrollbar"
      >
        {history.map((entry, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {entry.type === "input" ? (
              <span className="text-[#6cb6ff]">{entry.text}</span>
            ) : entry.type === "error" ? (
              <span className="text-[#f14c4c]">{entry.text}</span>
            ) : entry.type === "success" ? (
              <span className="text-[#73c991]">{entry.text}</span>
            ) : (
              <span className="text-[#cccccc]">{entry.text}</span>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center px-3 pb-2">
        <span className="text-[#73c991] font-mono text-[13px] mr-1 shrink-0">
          {cwd === "/" ? "~" : cwd.split("/").pop()}
        </span>
        <span className="text-[#6cb6ff] font-mono text-[13px] mr-2">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-[#cccccc] font-mono text-[13px] outline-none caret-[#6cb6ff]"
          placeholder="Type a command..."
          autoFocus
        />
      </form>
    </div>
  );
}

// ─── Problems View ───────────────────────────────────────────────────────────

function ProblemsView() {
  const errorCount = mockProblems.filter((p) => p.type === "error").length;
  const warningCount = mockProblems.filter((p) => p.type === "warning").length;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-4 px-4 py-2 text-[12px] text-[#858585] border-b border-[#2b2d3a]">
        <span className="flex items-center gap-1">
          <AlertCircle size={14} className="text-[#f14c4c]" />
          {errorCount} Errors
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle size={14} className="text-[#e2b93d]" />
          {warningCount} Warnings
        </span>
        <span className="flex items-center gap-1">
          <Info size={14} className="text-[#6cb6ff]" />0 Info
        </span>
      </div>
      <div className="px-2 py-1">
        {mockProblems.map((problem, i) => (
          <div
            key={i}
            className="flex items-start gap-2 px-2 py-[6px] hover:bg-[#2a2d3e] rounded cursor-pointer text-[13px]"
          >
            {problem.type === "error" ? (
              <AlertCircle
                size={14}
                className="text-[#f14c4c] shrink-0 mt-0.5"
              />
            ) : (
              <AlertTriangle
                size={14}
                className="text-[#e2b93d] shrink-0 mt-0.5"
              />
            )}
            <div className="min-w-0">
              <span className="text-[#cccccc]">{problem.message}</span>
              <span className="text-[#858585] ml-2">
                [{problem.file}:{problem.line}]
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Output View ─────────────────────────────────────────────────────────────

function OutputView() {
  return (
    <div className="h-full p-3 font-mono text-[13px] overflow-y-auto custom-scrollbar">
      <div className="text-[#858585]">
        [2024-01-15 10:32:14] Starting compilation...
      </div>
      <div className="text-[#73c991]">
        [2024-01-15 10:32:15] ✓ Compiled successfully in 1.2s
      </div>
      <div className="text-[#858585]">
        [2024-01-15 10:32:15] Watching for file changes...
      </div>
      <div className="text-[#6cb6ff]">
        [2024-01-15 10:33:01] File changed: src/components/App.tsx
      </div>
      <div className="text-[#858585]">
        [2024-01-15 10:33:01] Recompiling...
      </div>
      <div className="text-[#73c991]">
        [2024-01-15 10:33:02] ✓ Compiled successfully in 0.4s
      </div>
      <div className="text-[#e2b93d]">
        [2024-01-15 10:33:02] ⚠ 2 warnings found
      </div>
    </div>
  );
}

// ─── Bottom Panel ────────────────────────────────────────────────────────────

export default function BottomPanel({
  isOpen,
  onToggle,
  height,
  onHeightChange,
}: BottomPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("terminal");
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = height;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startY.current - e.clientY;
      const newHeight = Math.min(
        Math.max(startHeight.current + delta, 120),
        500
      );
      onHeightChange(newHeight);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const tabs: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
    { id: "terminal", label: "Terminal", icon: <Terminal size={14} /> },
    {
      id: "problems",
      label: "Problems",
      icon: <AlertTriangle size={14} />,
    },
    { id: "output", label: "Output", icon: <FileOutput size={14} /> },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="bg-[#1b1b2f] border-t border-[#2b2d3a] flex flex-col shrink-0"
      style={{ height: `${height}px` }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="h-[3px] cursor-ns-resize hover:bg-[#6366f1] transition-colors shrink-0"
      />

      {/* Tab bar */}
      <div className="flex items-center justify-between px-2 shrink-0 bg-[#1b1b2f]">
        <div className="flex items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "text-[#cccccc] border-[#6366f1]"
                  : "text-[#858585] border-transparent hover:text-[#cccccc]"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === "problems" && (
                <span className="ml-1 px-1.5 py-0 text-[10px] rounded-full bg-[#f14c4c]/20 text-[#f14c4c]">
                  {mockProblems.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {activeTab === "terminal" && (
            <>
              <button
                className="p-1 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors"
                title="New Terminal"
              >
                <Plus size={14} />
              </button>
              <button
                className="p-1 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors"
                title="Kill Terminal"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
          <button
            className="p-1 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors"
            title="Maximize"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={onToggle}
            className="p-1 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors"
            title="Close Panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "terminal" && <TerminalView />}
        {activeTab === "problems" && <ProblemsView />}
        {activeTab === "output" && <OutputView />}
      </div>
    </div>
  );
}
