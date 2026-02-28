"use client";

import React, { useState } from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import EditorArea from "@/components/EditorArea";
import BottomPanel from "@/components/BottomPanel";
import AIAssistant from "@/components/AIAssistant";
import StatusBar from "@/components/StatusBar";
import { FileSystemProvider } from "@/lib/fileSystem";
import { BotMessageSquare } from "lucide-react";

function IDEContent() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelHeight, setPanelHeight] = useState(200);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#11111b] text-[#cccccc] font-sans">
      {/* Top Navigation Bar */}
      <TopNav />

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center: Editor + Bottom Panel */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Editor */}
          <EditorArea />

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

export default function IDELayout() {
  return (
    <FileSystemProvider>
      <IDEContent />
    </FileSystemProvider>
  );
}
