"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Terminal,
  AlertTriangle,
  FileOutput,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Maximize2,
  AlertCircle,
  Info,
} from "lucide-react";
import { mockTerminalHistory, mockProblems } from "@/lib/mockData";

type PanelTab = "terminal" | "problems" | "output";

interface BottomPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  height: number;
  onHeightChange: (h: number) => void;
}

function TerminalView() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState(mockTerminalHistory);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newHistory = [
      ...history,
      { type: "input" as const, text: `$ ${input}` },
      {
        type: "output" as const,
        text:
          input === "clear"
            ? ""
            : input === "ls"
            ? "src/  public/  node_modules/  package.json  tsconfig.json  README.md"
            : input === "pwd"
            ? "/home/user/auris-ide"
            : input === "whoami"
            ? "developer"
            : input === "date"
            ? new Date().toString()
            : input === "node -v"
            ? "v20.11.0"
            : input === "npm -v"
            ? "10.4.0"
            : `command not found: ${input}`,
      },
    ];
    if (input === "clear") {
      setHistory([]);
    } else {
      setHistory(newHistory);
    }
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-[13px] leading-relaxed custom-scrollbar"
      >
        <div className="text-[#73c991] mb-2">
          Welcome to Auris Terminal. Type &apos;help&apos; for available commands.
        </div>
        {history.map((entry, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {entry.type === "input" ? (
              <span className="text-[#6cb6ff]">{entry.text}</span>
            ) : (
              <span className="text-[#cccccc]">{entry.text}</span>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center px-3 pb-2">
        <span className="text-[#6cb6ff] font-mono text-[13px] mr-2">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent text-[#cccccc] font-mono text-[13px] outline-none caret-[#6cb6ff]"
          placeholder="Type a command..."
          autoFocus
        />
      </form>
    </div>
  );
}

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
          <Info size={14} className="text-[#6cb6ff]" />
          0 Info
        </span>
      </div>
      <div className="px-2 py-1">
        {mockProblems.map((problem, i) => (
          <div
            key={i}
            className="flex items-start gap-2 px-2 py-[6px] hover:bg-[#2a2d3e] rounded cursor-pointer text-[13px]"
          >
            {problem.type === "error" ? (
              <AlertCircle size={14} className="text-[#f14c4c] shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={14} className="text-[#e2b93d] shrink-0 mt-0.5" />
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

function OutputView() {
  return (
    <div className="h-full p-3 font-mono text-[13px] overflow-y-auto custom-scrollbar">
      <div className="text-[#858585]">[2024-01-15 10:32:14] Starting compilation...</div>
      <div className="text-[#73c991]">[2024-01-15 10:32:15] ✓ Compiled successfully in 1.2s</div>
      <div className="text-[#858585]">[2024-01-15 10:32:15] Watching for file changes...</div>
      <div className="text-[#6cb6ff]">[2024-01-15 10:33:01] File changed: src/components/App.tsx</div>
      <div className="text-[#858585]">[2024-01-15 10:33:01] Recompiling...</div>
      <div className="text-[#73c991]">[2024-01-15 10:33:02] ✓ Compiled successfully in 0.4s</div>
      <div className="text-[#e2b93d]">[2024-01-15 10:33:02] ⚠ 2 warnings found</div>
    </div>
  );
}

export default function BottomPanel({ isOpen, onToggle, height, onHeightChange }: BottomPanelProps) {
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
      const newHeight = Math.min(Math.max(startHeight.current + delta, 120), 500);
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
    { id: "problems", label: "Problems", icon: <AlertTriangle size={14} /> },
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
              <button className="p-1 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors" title="New Terminal">
                <Plus size={14} />
              </button>
              <button className="p-1 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors" title="Kill Terminal">
                <Trash2 size={14} />
              </button>
            </>
          )}
          <button className="p-1 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors" title="Maximize">
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
