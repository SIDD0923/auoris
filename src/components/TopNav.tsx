"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Play,
  Bug,
  LayoutGrid,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function TopNav() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const userName = session?.user?.name ?? "User";
  const userEmail = session?.user?.email ?? "";
  const userImage = session?.user?.image;
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="h-9 bg-[#181825] flex items-center justify-between px-2 border-b border-[#2b2d3a] select-none shrink-0 z-50">
      {/* Left side - Menu */}
      <div className="flex items-center gap-1">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mr-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-[#6366f1] to-[#a78bfa] flex items-center justify-center text-white text-[8px] font-bold">
            A
          </div>
          <span className="text-[13px] font-semibold text-[#cccccc]">
            Auris IDE
          </span>
        </div>
        {/* Menu items */}
        {["File", "Edit", "Selection", "View", "Go", "Run", "Terminal", "Help"].map(
          (item) => (
            <button
              key={item}
              className="px-2 py-1 text-[13px] text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors duration-100"
            >
              {item}
            </button>
          )
        )}
      </div>

      {/* Center - Project name / breadcrumb */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        <span className="text-[12px] text-[#858585]">auris-ide</span>
        <span className="text-[12px] text-[#555] mx-1">—</span>
        <span className="text-[12px] text-[#858585]">Auris IDE</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        <button
          className="p-1.5 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors"
          title="Run"
        >
          <Play size={14} />
        </button>
        <button
          className="p-1.5 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors"
          title="Debug"
        >
          <Bug size={14} />
        </button>
        <button
          className="p-1.5 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors"
          title="Layout"
        >
          <LayoutGrid size={14} />
        </button>

        <div className="w-px h-4 bg-[#3c3f52] mx-1" />

        <button
          className="p-1.5 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors"
          title="Notifications"
        >
          <Bell size={14} />
        </button>
        <button
          className="p-1.5 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors"
          title="Settings"
        >
          <Settings size={14} />
        </button>

        {/* User avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="ml-1 flex items-center gap-2 px-2 py-1 hover:bg-[#2a2d3e] rounded transition-colors"
          >
            {userImage ? (
              <img
                src={userImage}
                alt={userName}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6366f1] to-[#a78bfa] flex items-center justify-center text-[10px] font-bold text-white">
                {initials}
              </div>
            )}
            <ChevronDown size={12} className="text-[#858585]" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-[#1e1e3a] border border-[#2b2d3a] rounded-lg shadow-xl shadow-black/30 z-[100] overflow-hidden">
              <div className="px-3 py-2.5 border-b border-[#2b2d3a]">
                <p className="text-[13px] text-[#ccc] font-medium truncate">
                  {userName}
                </p>
                <p className="text-[11px] text-[#888] truncate">{userEmail}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#f87171] hover:bg-[#2a2d3e] transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
