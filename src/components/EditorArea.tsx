"use client";

import React, { useEffect, useCallback } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import {
  X,
  FileCode,
  FileJson,
  FileText,
  FileType,
  File as FileIcon,
  Image,
  MoreHorizontal,
  SplitSquareHorizontal,
  Save,
} from "lucide-react";
import { useFileSystem } from "@/lib/fileSystem";

// Re-export Tab from fileSystem so existing imports still work
export type { Tab } from "@/lib/fileSystem";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTabIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return <FileCode size={14} className="text-blue-400" />;
    case "js":
    case "jsx":
      return <FileCode size={14} className="text-yellow-400" />;
    case "py":
      return <FileCode size={14} className="text-green-400" />;
    case "css":
    case "scss":
      return <FileType size={14} className="text-pink-400" />;
    case "json":
      return <FileJson size={14} className="text-yellow-300" />;
    case "md":
      return <FileText size={14} className="text-gray-400" />;
    case "svg":
    case "png":
    case "ico":
      return <Image size={14} className="text-green-400" />;
    default:
      return <FileIcon size={14} className="text-gray-400" />;
  }
}

function getMonacoLanguage(language?: string, fileName?: string): string {
  if (language === "typescript") return "typescript";
  if (language === "javascript") return "javascript";
  if (language === "python") return "python";
  if (language === "css") return "css";
  if (language === "json") return "json";
  if (language === "markdown") return "markdown";
  if (language === "xml") return "xml";
  if (language === "html") return "html";
  const ext = fileName?.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
      return "javascript";
    case "py":
      return "python";
    case "css":
      return "css";
    case "json":
      return "json";
    case "md":
      return "markdown";
    case "html":
      return "html";
    case "svg":
    case "xml":
      return "xml";
    default:
      return "plaintext";
  }
}

// ─── Welcome Screen ──────────────────────────────────────────────────────────

function WelcomeScreen() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#1e1e2e]">
      <div className="text-center space-y-6 max-w-lg">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a78bfa] flex items-center justify-center shadow-2xl shadow-purple-500/20">
          <span className="text-3xl font-bold text-white">A</span>
        </div>
        <h1 className="text-2xl font-light text-[#cccccc]">
          Welcome to Auris IDE
        </h1>
        <p className="text-[14px] text-[#858585] leading-relaxed">
          A modern, powerful web-based code editor. Open a file from the
          explorer to get started.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-8 text-[13px]">
          {[
            { key: "Ctrl+S", label: "Save File" },
            { key: "Ctrl+P", label: "Quick Open File" },
            { key: "Ctrl+Shift+F", label: "Search in Files" },
            { key: "Right-click", label: "New File / Folder" },
          ].map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#252837]/60 hover:bg-[#252837] transition-colors cursor-pointer border border-transparent hover:border-[#3c3f52]"
            >
              <kbd className="px-2 py-0.5 bg-[#1a1b2e] rounded text-[11px] text-[#858585] border border-[#3c3f52] font-mono">
                {shortcut.key}
              </kbd>
              <span className="text-[#a0a0a0]">{shortcut.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Editor Area ─────────────────────────────────────────────────────────────

export default function EditorArea() {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    closeTab,
    updateTabContent,
    saveActiveTab,
    isTabModified,
  } = useFileSystem();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Ctrl+S global shortcut
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveActiveTab();
      }
    },
    [saveActiveTab]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Add Ctrl+S to Monaco keybindings
  const handleEditorMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveActiveTab();
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeTabId && value !== undefined) {
      updateTabContent(activeTabId, value);
    }
  };

  if (tabs.length === 0) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e2e] min-w-0">
      {/* Tab bar */}
      <div className="flex items-center bg-[#181825] border-b border-[#2b2d3a] shrink-0 overflow-x-auto custom-scrollbar-h">
        <div className="flex items-center min-w-0">
          {tabs.map((tab) => {
            const modified = isTabModified(tab.id);
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2 px-3 h-[35px] cursor-pointer border-r border-[#2b2d3a] shrink-0 transition-colors duration-100 relative ${
                  tab.id === activeTabId
                    ? "bg-[#1e1e2e] text-[#ffffff]"
                    : "bg-[#181825] text-[#858585] hover:bg-[#1e1e2e]/50"
                }`}
              >
                {tab.id === activeTabId && (
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#6366f1]" />
                )}
                {getTabIcon(tab.name)}
                <span className="text-[13px] whitespace-nowrap">
                  {tab.name}
                </span>
                {modified ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#cccccc] shrink-0" />
                ) : null}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className={`ml-1 hover:bg-[#3c3f52] rounded p-0.5 transition-opacity ${
                    modified
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1 px-2 shrink-0">
          {activeTabId && isTabModified(activeTabId) && (
            <button
              onClick={saveActiveTab}
              className="p-1 text-[#6cb6ff] hover:text-white hover:bg-[#2a2d3e] rounded transition-colors"
              title="Save (Ctrl+S)"
            >
              <Save size={14} />
            </button>
          )}
          <button className="p-1 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors">
            <SplitSquareHorizontal size={14} />
          </button>
          <button className="p-1 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {activeTab && (
        <div className="flex items-center px-4 py-1 bg-[#1e1e2e] border-b border-[#2b2d3a] text-[12px] text-[#858585] shrink-0">
          {activeTab.path.split("/").map((part, i, arr) => (
            <React.Fragment key={i}>
              <span className="hover:text-[#cccccc] cursor-pointer transition-colors">
                {part}
              </span>
              {i < arr.length - 1 && (
                <span className="mx-1 text-[#555]">/</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 min-h-0">
        {activeTab ? (
          <Editor
            key={activeTab.id}
            height="100%"
            language={getMonacoLanguage(activeTab.language, activeTab.name)}
            value={activeTab.content}
            theme="vs-dark"
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            options={{
              fontSize: 14,
              fontFamily:
                "'Geist Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
              fontLigatures: true,
              lineHeight: 22,
              minimap: { enabled: true, scale: 1 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              padding: { top: 16 },
              renderLineHighlight: "all",
              renderWhitespace: "selection",
              bracketPairColorization: { enabled: true },
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              automaticLayout: true,
              scrollbar: {
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
              },
            }}
          />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
}
