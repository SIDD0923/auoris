"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  BotMessageSquare,
  X,
  Send,
  Sparkles,
  Code2,
  FileCode,
  RotateCcw,
  Copy,
  ChevronRight,
} from "lucide-react";

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

const presetPrompts = [
  { icon: <Code2 size={14} />, label: "Explain this code" },
  { icon: <FileCode size={14} />, label: "Generate a component" },
  { icon: <Sparkles size={14} />, label: "Optimize this function" },
  { icon: <RotateCcw size={14} />, label: "Refactor with best practices" },
];

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hello! I'm your AI coding assistant. I can help you with:\n\n• **Code explanation** — understand complex code\n• **Code generation** — create components, functions, and more\n• **Debugging** — find and fix issues\n• **Optimization** — improve performance\n\nHow can I help you today?",
    timestamp: new Date(),
  },
];

export default function AIAssistant({ isOpen, onToggle }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateMockResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-[#1b1b2f] border-l border-[#2b2d3a] flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b2d3a] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#a78bfa] flex items-center justify-center">
            <BotMessageSquare size={14} className="text-white" />
          </div>
          <span className="text-[13px] font-semibold text-[#cccccc]">AI Assistant</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#6366f1]/20 text-[#a78bfa] font-medium">
            Beta
          </span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d3e] rounded transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] rounded-xl px-3 py-2.5 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#6366f1] text-white rounded-br-sm"
                  : "bg-[#252837] text-[#cccccc] rounded-bl-sm border border-[#2b2d3a]"
              }`}
            >
              <div className="whitespace-pre-wrap">{renderMarkdown(msg.content)}</div>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#3c3f52]/50">
                  <button className="text-[11px] text-[#858585] hover:text-[#cccccc] flex items-center gap-1 transition-colors">
                    <Copy size={11} />
                    Copy
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#252837] rounded-xl rounded-bl-sm px-4 py-3 border border-[#2b2d3a]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset prompts */}
      <div className="px-3 py-2 border-t border-[#2b2d3a] shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {presetPrompts.map((prompt) => (
            <button
              key={prompt.label}
              onClick={() => setInput(prompt.label)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#252837] hover:bg-[#2e3148] text-[11px] text-[#a0a0a0] hover:text-[#cccccc] border border-[#2b2d3a] hover:border-[#3c3f52] transition-all"
            >
              {prompt.icon}
              {prompt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-3 pb-3 shrink-0">
        <div className="flex items-end gap-2 bg-[#252837] rounded-xl border border-[#2b2d3a] focus-within:border-[#6366f1]/50 transition-colors px-3 py-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            className="flex-1 bg-transparent text-[13px] text-[#cccccc] placeholder-[#686868] outline-none resize-none max-h-32 min-h-[24px]"
            style={{
              height: "auto",
              minHeight: "24px",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`p-1.5 rounded-lg transition-all shrink-0 ${
              input.trim()
                ? "bg-[#6366f1] text-white hover:bg-[#5558e6]"
                : "text-[#555] cursor-not-allowed"
            }`}
          >
            <Send size={14} />
          </button>
        </div>
        <div className="flex items-center justify-center mt-2">
          <span className="text-[10px] text-[#555]">
            <ChevronRight size={10} className="inline" /> Powered by AI • Ctrl+Shift+I to toggle
          </span>
        </div>
      </div>
    </div>
  );
}

function renderMarkdown(text: string) {
  // Very simple markdown-like rendering for bold text
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={i} className="font-semibold text-[#e0e0e0]">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}

function generateMockResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("explain")) {
    return "This code defines a React component that renders a sidebar navigation. Here's a breakdown:\n\n• **Lines 1-3**: Import statements for React and icons\n• **Lines 5-12**: Type definitions for the component props\n• **Lines 14-30**: The main component with state management\n• **Lines 32-45**: Render method with conditional styling\n\nThe component uses `useState` for tracking the active item and applies CSS classes dynamically.";
  }
  if (lower.includes("generate") || lower.includes("create")) {
    return '```tsx\ninterface ButtonProps {\n  label: string;\n  variant?: "primary" | "secondary";\n  onClick?: () => void;\n}\n\nexport const Button: React.FC<ButtonProps> = ({\n  label,\n  variant = "primary",\n  onClick,\n}) => {\n  return (\n    <button\n      onClick={onClick}\n      className={`px-4 py-2 rounded-lg font-medium transition-all ${\n        variant === "primary"\n          ? "bg-indigo-500 text-white hover:bg-indigo-600"\n          : "bg-gray-700 text-gray-200 hover:bg-gray-600"\n      }`}\n    >\n      {label}\n    </button>\n  );\n};\n```\n\nThis creates a reusable Button component with primary and secondary variants.';
  }
  if (lower.includes("optimize") || lower.includes("performance")) {
    return "Here are some optimization suggestions:\n\n1. **Memoize expensive computations** — Use `useMemo` for derived data\n2. **Prevent unnecessary re-renders** — Wrap child components in `React.memo`\n3. **Lazy load components** — Use `React.lazy` and `Suspense`\n4. **Virtualize long lists** — Use `react-window` or `react-virtuoso`\n5. **Debounce event handlers** — For search inputs and scroll events";
  }
  return "I can help with that! Here are a few approaches you might consider:\n\n1. **Start with the component structure** — Define your props and state\n2. **Implement core logic** — Add the main functionality\n3. **Add styling** — Use Tailwind classes for responsive design\n4. **Test thoroughly** — Write unit tests for edge cases\n\nWould you like me to elaborate on any of these steps?";
}
