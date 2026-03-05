import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Message, MessageHistory } from "../types/chat";
import { aiChatApi } from "../services/api";

// ─────────────────────────────────────────────────────────────────────────────
//  Quick-prompt chips — shown when the chat is empty.
//  Each maps to a real question the assistant can answer from DB data.
//  Based on what your AppDbContext actually has:
//    DailyLogs (attendance), TaskLogs, SupportLogs, BreakLogs,
//    EODReports, DailyGoals, LeaveRequests, WFHRequests, Kudos
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { label: "📋 My tasks today",       text: "What tasks did I log today?" },
  { label: "⏱ Hours this week",       text: "How many hours have I logged this week?" },
  { label: "📝 EOD report",            text: "Did I submit my EOD report today?" },
  { label: "🎯 Today's goal",          text: "What is my goal for today and did I achieve it?" },
  { label: "🏖 Leave status",          text: "What is the status of my leave requests?" },
  { label: "🏠 WFH requests",          text: "Do I have any pending WFH requests?" },
  { label: "☕ Breaks today",          text: "How many breaks did I take today?" },
  { label: "🏆 Kudos received",        text: "Have I received any kudos recently?" },
  { label: "🛠 Support work",          text: "What support work did I log this week?" },
  { label: "⚠ Missing logs",          text: "Are there any days this week I forgot to submit a log?" },
];

const INITIAL_MESSAGE: Message = {
  id:        "init",
  role:      "assistant",
  content:   "Hi! 👋 I'm your Daily Tracker Assistant.\n\nI have access to your real data — tasks, logs, EOD reports, goals, leave, WFH requests, and more. Ask me anything!",
  timestamp: new Date(),
};

// ─────────────────────────────────────────────────────────────────────────────
//  AssistantMessage
//  Renders Gemini's output properly. Gemini returns markdown-style text:
//    **bold** → <strong>
//    Lines starting with • or - → styled bullet row with blue dot
//    Plain lines → paragraph
//  Without this, users see raw asterisks like "**Task Name**".
// ─────────────────────────────────────────────────────────────────────────────
const AssistantMessage = ({ content }: { content: string }) => {
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );
  };

  return (
    <div className="space-y-1 text-sm leading-relaxed text-slate-200">
      {content.split("\n").map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith("• ") || trimmed.startsWith("- ")) {
          return (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5 shrink-0 text-xs leading-5">●</span>
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }
        return <p key={idx}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  TypingIndicator — dark theme version
// ─────────────────────────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex justify-start items-end gap-2">
    <div className="w-7 h-7 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center shrink-0 text-sm">
      🤖
    </div>
    <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-4 py-3">
      <div className="flex gap-1 items-center">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  ChatBubble — dark theme
//    User:      bg-blue-600 (unchanged — was already correct)
//    Assistant: bg-slate-800 border-slate-700 text-slate-200 (was bg-slate-100)
// ─────────────────────────────────────────────────────────────────────────────
const ChatBubble = ({ msg }: { msg: Message }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2`}>
      {!isUser && (
        <div className="w-7 h-7 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center shrink-0 text-sm">
          🤖
        </div>
      )}
      <div
        className={`max-w-[78%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none"
        }`}
      >
        {isUser
          ? <p className="whitespace-pre-wrap">{msg.content}</p>
          : <AssistantMessage content={msg.content} />
        }
        <p className={`text-xs mt-1.5 ${isUser ? "text-blue-200 text-right" : "text-slate-600"}`}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  AiChatWidget — main component
//  Logic is identical to the original. Only theme + quick prompts + markdown
//  renderer are new. All handleSend / handleClear / handleKeyDown unchanged.
// ─────────────────────────────────────────────────────────────────────────────
const AiChatWidget = () => {
  const [isOpen,     setIsOpen]     = useState(false);
  const [messages,   setMessages]   = useState<Message[]>([INITIAL_MESSAGE]);
  const [input,      setInput]      = useState("");
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  // Show quick prompts only before any real conversation starts
  const showQuickPrompts = messages.length === 1 && messages[0].id === "init" && !isLoading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Core send — accepts optional override text (used by quick prompts)
  const handleSend = async (overrideText?: string) => {
    const trimmed = (overrideText ?? input).trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id:        Date.now().toString(),
      role:      "user",
      content:   trimmed,
      timestamp: new Date(),
    };

    const history: MessageHistory[] = messages
      .filter((m) => m.id !== "init")
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiChatApi.sendMessage(trimmed, history);
      const data     = response.data;

      if (!data.success) throw new Error(data.error ?? "Unknown error");

      setMessages((prev) => [
        ...prev,
        {
          id:        (Date.now() + 1).toString(),
          role:      "assistant",
          content:   data.reply,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ??
        err?.message ??
        "Something went wrong. Please try again.";
      setError(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          id:        (Date.now() + 1).toString(),
          role:      "assistant",
          content:   "Sorry, I couldn't process your request. Please try again. 🙏",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([INITIAL_MESSAGE]);
    setError(null);
  };

  return (
    <>
      {/* ── Floating toggle button ── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-200"
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* ── Chat panel ── */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[580px] bg-slate-900 rounded-2xl shadow-2xl flex flex-col border border-slate-700 overflow-hidden">

          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-lg shrink-0">🤖</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-white">AI Assistant</p>
              <p className="text-xs text-blue-100">Daily Tracker · Live data</p>
            </div>
            <button
              onClick={handleClear}
              title="Clear chat"
              className="text-blue-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-red-900/30 border-b border-red-800/40 px-3 py-2 flex items-center gap-2 flex-shrink-0">
              <span className="text-red-400 text-xs">⚠️ {error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-300 text-xs">✕</button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-950">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} msg={msg} />
            ))}

            {/* Quick-prompt chips — visible only before any conversation */}
            {showQuickPrompts && (
              <div className="pt-1">
                <p className="text-slate-600 text-xs mb-2 px-0.5">Try asking:</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.text}
                      onClick={() => handleSend(qp.text)}
                      className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700
                                 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500
                                 active:scale-95 transition-all duration-150"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="px-3 py-3 border-t border-slate-800 flex gap-2 items-center bg-slate-900 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about logs, tasks, leave..."
              disabled={isLoading}
              className="flex-1 text-sm bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2
                         outline-none placeholder:text-slate-600
                         focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                         disabled:opacity-40 disabled:cursor-not-allowed transition"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500
                         text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
              aria-label="Send"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

        </div>
      )}
    </>
  );
};

export default AiChatWidget;