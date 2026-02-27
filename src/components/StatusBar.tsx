"use client";

import React from "react";
import {
  GitBranch,
  AlertTriangle,
  AlertCircle,
  Bell,
  CheckCircle2,
  Radio,
  Wifi,
  Braces,
  Indent,
} from "lucide-react";
import { mockProblems } from "@/lib/mockData";

interface StatusBarProps {
  onPanelToggle: () => void;
}

export default function StatusBar({ onPanelToggle }: StatusBarProps) {
  const errorCount = mockProblems.filter((p) => p.type === "error").length;
  const warningCount = mockProblems.filter((p) => p.type === "warning").length;

  return (
    <div className="h-[22px] bg-[#181825] border-t border-[#2b2d3a] flex items-center justify-between px-2 text-[11px] text-[#858585] select-none shrink-0 z-50">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Remote indicator */}
        <button className="flex items-center gap-1 hover:bg-[#2a2d3e] hover:text-[#cccccc] px-1.5 py-0.5 rounded transition-colors bg-[#6366f1]/20 text-[#a78bfa]">
          <Radio size={11} />
          <span>Remote</span>
        </button>

        {/* Branch */}
        <button className="flex items-center gap-1 hover:bg-[#2a2d3e] hover:text-[#cccccc] px-1 py-0.5 rounded transition-colors">
          <GitBranch size={12} />
          <span>main</span>
        </button>

        {/* Sync */}
        <button className="flex items-center gap-1 hover:bg-[#2a2d3e] hover:text-[#cccccc] px-1 py-0.5 rounded transition-colors">
          <CheckCircle2 size={12} />
          <span>0↓ 0↑</span>
        </button>

        {/* Problems */}
        <button
          onClick={onPanelToggle}
          className="flex items-center gap-2 hover:bg-[#2a2d3e] hover:text-[#cccccc] px-1 py-0.5 rounded transition-colors"
        >
          <span className="flex items-center gap-0.5">
            <AlertCircle size={12} className="text-[#f14c4c]" />
            {errorCount}
          </span>
          <span className="flex items-center gap-0.5">
            <AlertTriangle size={12} className="text-[#e2b93d]" />
            {warningCount}
          </span>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1 hover:bg-[#2a2d3e] hover:text-[#cccccc] px-1 py-0.5 rounded transition-colors">
          Ln 24, Col 8
        </button>
        <button className="flex items-center gap-1 hover:bg-[#2a2d3e] hover:text-[#cccccc] px-1 py-0.5 rounded transition-colors">
          <Indent size={12} />
          Spaces: 2
        </button>
        <button className="flex items-center gap-1 hover:bg-[#2a2d3e] hover:text-[#cccccc] px-1 py-0.5 rounded transition-colors">
          UTF-8
        </button>
        <button className="flex items-center gap-1 hover:bg-[#2a2d3e] hover:text-[#cccccc] px-1 py-0.5 rounded transition-colors">
          <Braces size={12} />
          TypeScript React
        </button>
        <button className="flex items-center gap-1 hover:bg-[#2a2d3e] hover:text-[#cccccc] px-1 py-0.5 rounded transition-colors">
          <Wifi size={12} className="text-[#73c991]" />
        </button>
        <button className="flex items-center gap-1 hover:bg-[#2a2d3e] hover:text-[#cccccc] px-1 py-0.5 rounded transition-colors">
          <Bell size={12} />
        </button>
      </div>
    </div>
  );
}
