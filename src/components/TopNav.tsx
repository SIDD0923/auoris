"use client";

import React from "react";
import {
  ChevronDown,
  Play,
  Bug,
  LayoutGrid,
  User,
  Bell,
  Settings,
} from "lucide-react";

export default function TopNav() {
  return (
    <div className="h-9 bg-[#181825] flex items-center justify-between px-2 border-b border-[#2b2d3a] select-none shrink-0 z-50">
      {/* Left side - Menu */}
      <div className="flex items-center gap-1">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mr-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-[#6366f1] to-[#a78bfa] flex items-center justify-center text-white text-[8px] font-bold">
            A
          </div>
          <span className="text-[13px] font-semibold text-[#cccccc]">Auris IDE</span>
        </div>
        {/* Menu items */}
        {["File", "Edit", "Selection", "View", "Go", "Run", "Terminal", "Help"].map((item) => (
          <button
            key={item}
            className="px-2 py-1 text-[13px] text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors duration-100"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Center - Project name / breadcrumb */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        <span className="text-[12px] text-[#858585]">auris-ide</span>
        <span className="text-[12px] text-[#555] mx-1">—</span>
        <span className="text-[12px] text-[#858585]">Auris IDE</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        <button className="p-1.5 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors" title="Run">
          <Play size={14} />
        </button>
        <button className="p-1.5 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors" title="Debug">
          <Bug size={14} />
        </button>
        <button className="p-1.5 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors" title="Layout">
          <LayoutGrid size={14} />
        </button>

        <div className="w-px h-4 bg-[#3c3f52] mx-1" />

        <button className="p-1.5 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors" title="Notifications">
          <Bell size={14} />
        </button>
        <button className="p-1.5 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors" title="Settings">
          <Settings size={14} />
        </button>

        {/* User avatar */}
        <button className="ml-1 flex items-center gap-2 px-2 py-1 hover:bg-[#2a2d3e] rounded transition-colors">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f97316] to-[#ec4899] flex items-center justify-center">
            <User size={13} className="text-white" />
          </div>
          <ChevronDown size={12} className="text-[#858585]" />
        </button>
      </div>
    </div>
  );
}
