"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import {
  Users,
  Plus,
  Send,
  X,
  Crown,
  Pencil,
  MessageSquare,
  Eye,
  Shield,
  ChevronLeft,
  UserPlus,
  Lock,
  Unlock,
  Trash2,
  Settings,
  Loader2,
  Search,
  FileCode,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Group {
  groupId: string;
  groupName: string;
  groupDescription: string | null;
  role: string;
  createdBy: string;
  createdAt: string;
}

interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  members: Member[];
  myRole: string;
}

interface Member {
  memberId: string;
  userId: string;
  role: string;
  joinedAt: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
}

interface FilePermission {
  id: string;
  groupId: string;
  filePath: string;
  access: "visible" | "locked";
  updatedAt: string;
}

interface TypingUser {
  userId: string;
  userName: string;
}

// ─── Role helpers ────────────────────────────────────────────────────────────

const roleIcon = (role: string) => {
  switch (role) {
    case "admin":
      return <Crown size={12} className="text-yellow-400" />;
    case "editor":
      return <Pencil size={12} className="text-blue-400" />;
    case "commenter":
      return <MessageSquare size={12} className="text-green-400" />;
    default:
      return <Eye size={12} className="text-gray-400" />;
  }
};

const roleColor = (role: string) => {
  switch (role) {
    case "admin":
      return "text-yellow-400";
    case "editor":
      return "text-blue-400";
    case "commenter":
      return "text-green-400";
    default:
      return "text-gray-400";
  }
};

// ─── Main component ──────────────────────────────────────────────────────────

interface CollaborationPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

type Tab = "chat" | "members" | "files";

export default function CollaborationPanel({
  isOpen,
  onToggle,
}: CollaborationPanelProps) {
  const { data: session } = useSession();

  // ─── State ─────────────────────────────────────────────────────────────
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [loading, setLoading] = useState(false);

  // Create group
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [createMembers, setCreateMembers] = useState<
    { email: string; role: string }[]
  >([]);
  const [createEmail, setCreateEmail] = useState("");
  const [createRole, setCreateRole] = useState("viewer");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const lastMsgTime = useRef<string | null>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  // Add member
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("viewer");
  const [addError, setAddError] = useState<string | null>(null);

  // Files
  const [filePerms, setFilePerms] = useState<FilePermission[]>([]);
  const [newFilePath, setNewFilePath] = useState("");
  const [newFileAccess, setNewFileAccess] = useState<"visible" | "locked">(
    "locked"
  );

  // ─── Load groups ───────────────────────────────────────────────────────
  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isOpen) loadGroups();
  }, [isOpen, loadGroups]);

  // ─── Load group detail ─────────────────────────────────────────────────
  const loadGroupDetail = useCallback(async (groupId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) setGroupDetail(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupDetail(selectedGroup);
    }
  }, [selectedGroup, loadGroupDetail]);

  // ─── Load messages (polling every 2s) ──────────────────────────────────
  const loadMessages = useCallback(async (groupId: string, after?: string) => {
    const url = after
      ? `/api/groups/${groupId}/messages?after=${encodeURIComponent(after)}`
      : `/api/groups/${groupId}/messages`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data: Message[] = await res.json();
        if (after && data.length > 0) {
          setMessages((prev) => [...prev, ...data]);
        } else if (!after) {
          setMessages(data);
        }
        if (data.length > 0) {
          lastMsgTime.current = data[data.length - 1].createdAt;
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!selectedGroup || activeTab !== "chat") return;

    // Initial load
    lastMsgTime.current = null;
    loadMessages(selectedGroup);

    const interval = setInterval(() => {
      if (lastMsgTime.current) {
        loadMessages(selectedGroup, lastMsgTime.current);
      } else {
        loadMessages(selectedGroup);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [selectedGroup, activeTab, loadMessages]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // ─── Typing indicator polling ──────────────────────────────────────────
  useEffect(() => {
    if (!selectedGroup || activeTab !== "chat") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/groups/${selectedGroup}/typing`);
        if (res.ok) setTypingUsers(await res.json());
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedGroup, activeTab]);

  const signalTyping = useCallback(() => {
    if (!selectedGroup) return;
    fetch(`/api/groups/${selectedGroup}/typing`, { method: "POST" });
  }, [selectedGroup]);

  // ─── Load file permissions ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedGroup || activeTab !== "files") return;
    (async () => {
      try {
        const res = await fetch(`/api/groups/${selectedGroup}/files`);
        if (res.ok) {
          const data = await res.json();
          setFilePerms(data.permissions);
        }
      } catch {}
    })();
  }, [selectedGroup, activeTab]);

  // ─── Handlers ──────────────────────────────────────────────────────────
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc,
          members: createMembers,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewGroupName("");
        setNewGroupDesc("");
        setCreateMembers([]);
        loadGroups();
      }
    } catch {}
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!msgInput.trim() || !selectedGroup || sendingMsg) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`/api/groups/${selectedGroup}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: msgInput }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        lastMsgTime.current = msg.createdAt;
        setMsgInput("");
      }
    } catch {}
    setSendingMsg(false);
  };

  const handleAddMember = async () => {
    if (!addEmail.trim() || !selectedGroup) return;
    setAddError(null);
    try {
      const res = await fetch(`/api/groups/${selectedGroup}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail, role: addRole }),
      });
      if (res.ok) {
        setAddEmail("");
        loadGroupDetail(selectedGroup);
      } else {
        const data = await res.json();
        setAddError(data.error);
      }
    } catch {
      setAddError("Failed to add member");
    }
  };

  const handleChangeRole = async (userId: string, role: string) => {
    if (!selectedGroup) return;
    await fetch(`/api/groups/${selectedGroup}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    loadGroupDetail(selectedGroup);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;
    await fetch(`/api/groups/${selectedGroup}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    loadGroupDetail(selectedGroup);
  };

  const handleSetFilePermission = async () => {
    if (!newFilePath.trim() || !selectedGroup) return;
    await fetch(`/api/groups/${selectedGroup}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath: newFilePath, access: newFileAccess }),
    });
    setNewFilePath("");
    // Reload
    const res = await fetch(`/api/groups/${selectedGroup}/files`);
    if (res.ok) {
      const data = await res.json();
      setFilePerms(data.permissions);
    }
  };

  const handleRemoveFilePermission = async (filePath: string) => {
    if (!selectedGroup) return;
    await fetch(`/api/groups/${selectedGroup}/files`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath }),
    });
    const res = await fetch(`/api/groups/${selectedGroup}/files`);
    if (res.ok) {
      const data = await res.json();
      setFilePerms(data.permissions);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    if (!confirm("Delete this group permanently?")) return;
    await fetch(`/api/groups/${selectedGroup}`, { method: "DELETE" });
    setSelectedGroup(null);
    setGroupDetail(null);
    loadGroups();
  };

  // ─── Render ────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  const isAdmin = groupDetail?.myRole === "admin";

  return (
    <div className="w-80 lg:w-96 bg-[#14142b] border-l border-[#2b2d3a] flex flex-col h-full select-none shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2b2d3a] bg-[#181825]">
        <div className="flex items-center gap-2">
          {selectedGroup && (
            <button
              onClick={() => {
                setSelectedGroup(null);
                setGroupDetail(null);
                setMessages([]);
              }}
              className="p-1 rounded hover:bg-[#2b2d3a] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <Users size={16} className="text-[#6366f1]" />
          <span className="text-sm font-semibold text-[#cccccc] truncate">
            {selectedGroup && groupDetail
              ? groupDetail.name
              : "Collaboration"}
          </span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-[#2b2d3a] transition-colors"
        >
          <X size={16} className="text-[#888]" />
        </button>
      </div>

      {/* ─── Group List View ──────────────────────────────────────────────── */}
      {!selectedGroup && !showCreate && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Create group button */}
          <div className="p-3 border-b border-[#2b2d3a]">
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#6366f1] hover:bg-[#5558e6] text-white text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Create Group
            </button>
          </div>

          {/* Group list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <Users size={36} className="text-[#3c3f52] mb-3" />
                <p className="text-sm text-[#888] mb-1">No groups yet</p>
                <p className="text-xs text-[#555]">
                  Create a group or get invited to start collaborating
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {groups.map((g) => (
                  <button
                    key={g.groupId}
                    onClick={() => setSelectedGroup(g.groupId)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#1e1e3a] transition-colors text-left group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#6366f1]/20 to-[#a78bfa]/20 flex items-center justify-center border border-[#6366f1]/20 shrink-0">
                      <Users size={16} className="text-[#6366f1]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#cccccc] truncate">
                        {g.groupName}
                      </p>
                      <p className="text-xs text-[#666] flex items-center gap-1">
                        {roleIcon(g.role)}
                        <span className={roleColor(g.role)}>{g.role}</span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Create Group View ────────────────────────────────────────────── */}
      {!selectedGroup && showCreate && (
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-4 gap-4">
          <div>
            <label className="block text-xs text-[#888] mb-1.5 font-medium">
              Group Name *
            </label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Frontend Team"
              className="w-full px-3 py-2.5 rounded-lg bg-[#1e1e3a] border border-[#2b2d3a] text-sm text-[#cccccc] placeholder-[#555] outline-none focus:border-[#6366f1]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-[#888] mb-1.5 font-medium">
              Description
            </label>
            <input
              type="text"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              placeholder="What is this group for?"
              className="w-full px-3 py-2.5 rounded-lg bg-[#1e1e3a] border border-[#2b2d3a] text-sm text-[#cccccc] placeholder-[#555] outline-none focus:border-[#6366f1]/50 transition-colors"
            />
          </div>

          {/* Invite members at creation */}
          <div>
            <label className="block text-xs text-[#888] mb-1.5 font-medium">
              Invite Members
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="user@email.com"
                className="flex-1 px-3 py-2 rounded-lg bg-[#1e1e3a] border border-[#2b2d3a] text-sm text-[#cccccc] placeholder-[#555] outline-none focus:border-[#6366f1]/50 transition-colors"
              />
              <select
                value={createRole}
                onChange={(e) => setCreateRole(e.target.value)}
                className="px-2 py-2 rounded-lg bg-[#1e1e3a] border border-[#2b2d3a] text-xs text-[#cccccc] outline-none"
              >
                <option value="viewer">Viewer</option>
                <option value="commenter">Commenter</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={() => {
                  if (createEmail.trim()) {
                    setCreateMembers((prev) => [
                      ...prev,
                      { email: createEmail.trim(), role: createRole },
                    ]);
                    setCreateEmail("");
                  }
                }}
                className="px-3 py-2 rounded-lg bg-[#6366f1] text-white text-xs hover:bg-[#5558e6] transition-colors"
              >
                Add
              </button>
            </div>

            {/* Added members list */}
            {createMembers.length > 0 && (
              <div className="mt-2 space-y-1">
                {createMembers.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-1.5 rounded bg-[#1e1e3a] text-xs"
                  >
                    <span className="text-[#cccccc] truncate">{m.email}</span>
                    <div className="flex items-center gap-2">
                      <span className={roleColor(m.role)}>{m.role}</span>
                      <button
                        onClick={() =>
                          setCreateMembers((prev) =>
                            prev.filter((_, j) => j !== i)
                          )
                        }
                        className="text-[#555] hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                setShowCreate(false);
                setCreateMembers([]);
              }}
              className="flex-1 px-3 py-2.5 rounded-lg border border-[#2b2d3a] text-sm text-[#888] hover:bg-[#1e1e3a] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={loading || !newGroupName.trim()}
              className="flex-1 px-3 py-2.5 rounded-lg bg-[#6366f1] text-white text-sm font-medium hover:bg-[#5558e6] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin mx-auto" />
              ) : (
                "Create"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── Selected Group View ──────────────────────────────────────────── */}
      {selectedGroup && groupDetail && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#2b2d3a]">
            {(["chat", "members", "files"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-2 py-2.5 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "text-[#6366f1] border-b-2 border-[#6366f1] bg-[#6366f1]/5"
                    : "text-[#888] hover:text-[#cccccc]"
                }`}
              >
                {tab === "chat" && (
                  <MessageSquare size={13} className="inline mr-1 mb-0.5" />
                )}
                {tab === "members" && (
                  <Users size={13} className="inline mr-1 mb-0.5" />
                )}
                {tab === "files" && (
                  <Shield size={13} className="inline mr-1 mb-0.5" />
                )}
                {tab}
              </button>
            ))}
          </div>

          {/* ─── Chat Tab ──────────────────────────────────────────────────── */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Messages */}
              <div
                ref={chatRef}
                className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare size={28} className="text-[#3c3f52] mb-2" />
                    <p className="text-xs text-[#666]">
                      No messages yet. Say hello!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.userId === session?.user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${
                          isMe ? "flex-row-reverse" : ""
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isMe
                              ? "bg-[#6366f1] text-white"
                              : "bg-[#2b2d3a] text-[#888]"
                          }`}
                        >
                          {msg.userImage ? (
                            <img
                              src={msg.userImage}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            msg.userName
                              ?.split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()
                          )}
                        </div>
                        <div
                          className={`max-w-[75%] ${
                            isMe ? "text-right" : ""
                          }`}
                        >
                          <p className="text-[10px] text-[#666] mb-0.5">
                            {isMe ? "You" : msg.userName}{" "}
                            <span className="text-[#444]">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </p>
                          <div
                            className={`inline-block px-3 py-2 rounded-xl text-sm leading-relaxed ${
                              isMe
                                ? "bg-[#6366f1] text-white rounded-tr-sm"
                                : "bg-[#1e1e3a] text-[#cccccc] rounded-tl-sm"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="px-3 py-1">
                  <p className="text-[10px] text-[#6366f1] italic">
                    {typingUsers.map((t) => t.userName).join(", ")}{" "}
                    {typingUsers.length === 1 ? "is" : "are"} typing…
                  </p>
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-[#2b2d3a]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={msgInput}
                    onChange={(e) => {
                      setMsgInput(e.target.value);
                      signalTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message…"
                    className="flex-1 px-3 py-2 rounded-lg bg-[#1e1e3a] border border-[#2b2d3a] text-sm text-[#cccccc] placeholder-[#555] outline-none focus:border-[#6366f1]/50 transition-colors"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMsg || !msgInput.trim()}
                    className="px-3 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5558e6] text-white transition-colors disabled:opacity-40"
                  >
                    {sendingMsg ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Members Tab ───────────────────────────────────────────────── */}
          {activeTab === "members" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Add member (admin only) */}
              {isAdmin && (
                <div className="p-3 border-b border-[#2b2d3a] space-y-2">
                  <p className="text-xs text-[#888] font-medium flex items-center gap-1">
                    <UserPlus size={13} /> Invite Member
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      placeholder="user@email.com"
                      className="flex-1 px-3 py-2 rounded-lg bg-[#1e1e3a] border border-[#2b2d3a] text-sm text-[#cccccc] placeholder-[#555] outline-none focus:border-[#6366f1]/50 transition-colors"
                    />
                    <select
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value)}
                      className="px-2 py-2 rounded-lg bg-[#1e1e3a] border border-[#2b2d3a] text-xs text-[#cccccc] outline-none"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="commenter">Commenter</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddMember}
                    disabled={!addEmail.trim()}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[#6366f1] text-white text-xs font-medium hover:bg-[#5558e6] transition-colors disabled:opacity-50"
                  >
                    <UserPlus size={13} /> Add
                  </button>
                  {addError && (
                    <p className="text-xs text-red-400">{addError}</p>
                  )}
                </div>
              )}

              {/* Member list */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {groupDetail.members.map((m) => (
                  <div
                    key={m.memberId}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[#1e1e3a] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#2b2d3a] flex items-center justify-center text-[10px] font-bold text-[#888] shrink-0">
                      {m.userImage ? (
                        <img
                          src={m.userImage}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        m.userName
                          ?.split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#cccccc] truncate">
                        {m.userName}
                        {m.userId === session?.user?.id && (
                          <span className="text-[10px] text-[#666] ml-1">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-[#666] truncate">
                        {m.userEmail}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {isAdmin && m.userId !== session?.user?.id ? (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            handleChangeRole(m.userId, e.target.value)
                          }
                          className="px-1.5 py-1 rounded bg-[#1e1e3a] border border-[#2b2d3a] text-[10px] text-[#cccccc] outline-none"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="commenter">Commenter</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span
                          className={`text-[10px] font-medium flex items-center gap-1 ${roleColor(
                            m.role
                          )}`}
                        >
                          {roleIcon(m.role)} {m.role}
                        </span>
                      )}
                      {isAdmin && m.userId !== session?.user?.id && (
                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          className="p-1 rounded hover:bg-red-500/10 text-[#555] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin actions */}
              {isAdmin && (
                <div className="p-3 border-t border-[#2b2d3a]">
                  <button
                    onClick={handleDeleteGroup}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-red-500/20 text-red-400 text-xs hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={12} /> Delete Group
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── Files Tab (Admin Lock Controls) ───────────────────────────── */}
          {activeTab === "files" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {isAdmin && (
                <div className="p-3 border-b border-[#2b2d3a] space-y-2">
                  <p className="text-xs text-[#888] font-medium flex items-center gap-1">
                    <Shield size={13} /> File Access Control
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFilePath}
                      onChange={(e) => setNewFilePath(e.target.value)}
                      placeholder="/src/secret.ts"
                      className="flex-1 px-3 py-2 rounded-lg bg-[#1e1e3a] border border-[#2b2d3a] text-sm text-[#cccccc] placeholder-[#555] outline-none focus:border-[#6366f1]/50 transition-colors"
                    />
                    <select
                      value={newFileAccess}
                      onChange={(e) =>
                        setNewFileAccess(
                          e.target.value as "visible" | "locked"
                        )
                      }
                      className="px-2 py-2 rounded-lg bg-[#1e1e3a] border border-[#2b2d3a] text-xs text-[#cccccc] outline-none"
                    >
                      <option value="visible">Visible</option>
                      <option value="locked">Locked</option>
                    </select>
                  </div>
                  <button
                    onClick={handleSetFilePermission}
                    disabled={!newFilePath.trim()}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[#6366f1] text-white text-xs font-medium hover:bg-[#5558e6] transition-colors disabled:opacity-50"
                  >
                    <Shield size={13} /> Set Permission
                  </button>
                </div>
              )}

              {/* File permission list */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {filePerms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <FileCode size={28} className="text-[#3c3f52] mb-2" />
                    <p className="text-xs text-[#666]">
                      {isAdmin
                        ? "No file permissions set. All files are visible by default."
                        : "No file restrictions in this group."}
                    </p>
                  </div>
                ) : (
                  filePerms.map((fp) => (
                    <div
                      key={fp.id}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#1e1e3a] group"
                    >
                      {fp.access === "locked" ? (
                        <Lock size={14} className="text-red-400 shrink-0" />
                      ) : (
                        <Unlock
                          size={14}
                          className="text-green-400 shrink-0"
                        />
                      )}
                      <span className="flex-1 text-sm text-[#cccccc] truncate font-mono">
                        {fp.filePath}
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          fp.access === "locked"
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {fp.access}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() =>
                            handleRemoveFilePermission(fp.filePath)
                          }
                          className="p-1 text-[#555] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {!isAdmin && (
                <div className="p-3 border-t border-[#2b2d3a]">
                  <p className="text-[10px] text-[#666] text-center">
                    Only admins can manage file permissions
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
