"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useFileSystem } from "@/lib/fileSystem";
import {
  BotMessageSquare,
  X,
  Send,
  Sparkles,
  Code2,
  Bug,
  FileCode,
  RotateCcw,
  Copy,
  Check,
  ChevronRight,
  AlertTriangle,
  Trash2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

// ─── Welcome message ─────────────────────────────────────────────────────────

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm your AI coding assistant powered by **Groq + Llama 3.3**. I can help you with:\n\n" +
    "- **Debug code** — find and fix issues\n" +
    "- **Explain errors** — understand what went wrong\n" +
    "- **Suggest improvements** — optimize & refactor\n" +
    "- **Generate code** — create components & functions\n\n" +
    "I automatically see the file you have open. Just ask away!",
  timestamp: new Date(),
};

// ─── Presets ─────────────────────────────────────────────────────────────────

const presetPrompts = [
  { icon: <Bug size={13} />, label: "Debug this code" },
  { icon: <Code2 size={13} />, label: "Explain this code" },
  { icon: <Sparkles size={13} />, label: "Suggest improvements" },
  { icon: <FileCode size={13} />, label: "Generate a component" },
  { icon: <RotateCcw size={13} />, label: "Refactor with best practices" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function AIAssistant({ isOpen, onToggle }: AIAssistantProps) {
  const { tabs, activeTabId } = useFileSystem();

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Build file context from active tab
  const getFileContext = useCallback(() => {
    if (!activeTabId) return null;
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return null;
    return {
      fileName: tab.name,
      language: tab.language,
      content: tab.content,
    };
  }, [tabs, activeTabId]);

  // ── Send message ─────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    // Resize textarea back
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
    }

    try {
      // Build history (skip welcome message)
      const history = [...messages.filter((m) => m.id !== "welcome"), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          fileContext: getFileContext(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`);
        setLoading(false);
        return;
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setError("Network error. Make sure the dev server is running.");
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, getFileContext]);

  // ── Keyboard ─────────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Auto-resize textarea ────────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "24px";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  };

  // ── Copy ─────────────────────────────────────────────────────────────────

  const handleCopy = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // ── Clear chat ───────────────────────────────────────────────────────────

  const handleClear = () => {
    setMessages([WELCOME]);
    setError(null);
  };

  // ── Preset click ─────────────────────────────────────────────────────────

  const handlePreset = (label: string) => {
    setInput(label);
    textareaRef.current?.focus();
  };

  if (!isOpen) return null;

  // Active file badge text
  const fileCtx = getFileContext();

  return (
    <div className="w-80 bg-[#1b1b2f] border-l border-[#2b2d3a] flex flex-col shrink-0">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b2d3a] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#a78bfa] flex items-center justify-center">
            <BotMessageSquare size={14} className="text-white" />
          </div>
          <span className="text-[13px] font-semibold text-[#cccccc]">
            AI Assistant
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#6366f1]/20 text-[#a78bfa] font-medium">
            Llama 3.3
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            title="Clear chat"
            className="p-1 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={onToggle}
            className="p-1 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── File context badge ───────────────────────────────────────────── */}
      {fileCtx && (
        <div className="px-4 py-2 border-b border-[#2b2d3a] flex items-center gap-2">
          <FileCode size={12} className="text-[#a78bfa] shrink-0" />
          <span className="text-[11px] text-[#888] truncate">
            Context: <span className="text-[#a78bfa]">{fileCtx.fileName}</span>{" "}
            ({fileCtx.language})
          </span>
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[92%] rounded-xl px-3 py-2.5 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#6366f1] text-white rounded-br-sm"
                  : "bg-[#252837] text-[#cccccc] rounded-bl-sm border border-[#2b2d3a]"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="ai-markdown prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom code block rendering
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const codeString = String(children).replace(/\n$/, "");
                        if (match) {
                          return (
                            <div className="relative group my-2">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a2e] rounded-t-lg border border-b-0 border-[#3c3f52]/50">
                                <span className="text-[10px] text-[#888] uppercase tracking-wide">
                                  {match[1]}
                                </span>
                                <button
                                  onClick={() =>
                                    handleCopy(`code-${msg.id}-${match[1]}`, codeString)
                                  }
                                  className="text-[10px] text-[#888] hover:text-[#ccc] flex items-center gap-1 transition-colors"
                                >
                                  {copiedId === `code-${msg.id}-${match[1]}` ? (
                                    <>
                                      <Check size={10} /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={10} /> Copy
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="!m-0 !rounded-t-none bg-[#0d0d1a] border border-t-0 border-[#3c3f52]/50 overflow-x-auto">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            </div>
                          );
                        }
                        // Inline code
                        return (
                          <code
                            className="bg-[#2a2d42] text-[#e0a0ff] px-1.5 py-0.5 rounded text-[12px]"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      // Style links
                      a({ children, ...props }) {
                        return (
                          <a
                            className="text-[#818cf8] hover:text-[#a5b4fc] underline"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                          >
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}

              {/* Copy full response */}
              {msg.role === "assistant" && msg.id !== "welcome" && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#3c3f52]/50">
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="text-[11px] text-[#858585] hover:text-[#cccccc] flex items-center gap-1 transition-colors"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check size={11} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={11} /> Copy
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* ── Loading indicator ────────────────────────────────────────── */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#252837] rounded-xl rounded-bl-sm px-4 py-3 border border-[#2b2d3a]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span className="text-[11px] text-[#888]">Thinking…</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Error banner ─────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-[#3a1a1a] border border-[#5a2a2a] rounded-lg text-[12px] text-[#f87171]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Preset prompts ─────────────────────────────────────────────── */}
      <div className="px-3 py-2 border-t border-[#2b2d3a] shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {presetPrompts.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p.label)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#252837] hover:bg-[#2e3148] text-[11px] text-[#a0a0a0] hover:text-[#cccccc] border border-[#2b2d3a] hover:border-[#3c3f52] transition-all"
            >
              {p.icon}
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input area ─────────────────────────────────────────────────── */}
      <div className="px-3 pb-3 shrink-0">
        <div className="flex items-end gap-2 bg-[#252837] rounded-xl border border-[#2b2d3a] focus-within:border-[#6366f1]/50 transition-colors px-3 py-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={loading ? "Waiting for response…" : "Ask me anything…"}
            disabled={loading}
            rows={1}
            className="flex-1 bg-transparent text-[13px] text-[#cccccc] placeholder-[#686868] outline-none resize-none max-h-32 min-h-[24px] disabled:opacity-50"
            style={{ height: "24px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={`p-1.5 rounded-lg transition-all shrink-0 ${
              input.trim() && !loading
                ? "bg-[#6366f1] text-white hover:bg-[#5558e6]"
                : "text-[#555] cursor-not-allowed"
            }`}
          >
            <Send size={14} />
          </button>
        </div>
        <div className="flex items-center justify-center mt-2">
          <span className="text-[10px] text-[#555]">
            <ChevronRight size={10} className="inline" /> Powered by Groq •
            Ctrl+Shift+I to toggle
          </span>
        </div>
      </div>
    </div>
  );
}
