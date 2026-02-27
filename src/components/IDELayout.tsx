"use client";

import React, { useState, useCallback } from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import EditorArea, { Tab } from "@/components/EditorArea";
import BottomPanel from "@/components/BottomPanel";
import AIAssistant from "@/components/AIAssistant";
import StatusBar from "@/components/StatusBar";
import { FileNode } from "@/lib/mockData";
import { BotMessageSquare } from "lucide-react";

export default function IDELayout() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelHeight, setPanelHeight] = useState(200);
  const [aiOpen, setAiOpen] = useState(false);

  const handleFileSelect = useCallback(
    (file: FileNode, path: string) => {
      if (file.type !== "file" || !file.content) return;

      // Check if tab already exists
      const existing = tabs.find((t) => t.path === path);
      if (existing) {
        setActiveTabId(existing.id);
        return;
      }

      const newTab: Tab = {
        id: `tab-${Date.now()}`,
        name: file.name,
        path,
        language: file.language || "plaintext",
        content: file.content,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
    },
    [tabs]
  );

  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const handleTabClose = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const newTabs = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId) {
          const idx = prev.findIndex((t) => t.id === tabId);
          const next = newTabs[Math.min(idx, newTabs.length - 1)];
          setActiveTabId(next?.id ?? null);
        }
        return newTabs;
      });
    },
    [activeTabId]
  );

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#11111b] text-[#cccccc] font-sans">
      {/* Top Navigation Bar */}
      <TopNav />

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar onFileSelect={handleFileSelect} />

        {/* Center: Editor + Bottom Panel */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Editor */}
          <EditorArea
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={handleTabSelect}
            onTabClose={handleTabClose}
          />

          {/* Bottom Panel */}
          <BottomPanel
            isOpen={panelOpen}
            onToggle={() => setPanelOpen(!panelOpen)}
            height={panelHeight}
            onHeightChange={setPanelHeight}
          />
        </div>

        {/* Right AI Assistant */}
        <AIAssistant isOpen={aiOpen} onToggle={() => setAiOpen(!aiOpen)} />

        {/* AI Toggle Floating Button (when closed) */}
        {!aiOpen && (
          <button
            onClick={() => setAiOpen(true)}
            className="fixed bottom-10 right-4 z-50 w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all"
            title="Open AI Assistant"
          >
            <BotMessageSquare size={18} className="text-white" />
          </button>
        )}
      </div>

      {/* Status Bar */}
      <StatusBar onPanelToggle={() => setPanelOpen(!panelOpen)} />
    </div>
  );
}
