import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Maximize2,
  Brain,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  Sliders,
  DollarSign,
  ChevronDown,
} from "lucide-react";
import { copilotService } from "../../services/copilotService";
import { formatINR } from "../../utils/formatCurrency";

const SUGGESTED_QUESTIONS = [
  "What is my current cash runway?",
  "Calculate my tax under Section 44ADA vs New Regime",
  "Can I afford a ₹75,000 MacBook Air?",
  "Detect my spending anomalies this month",
];

export default function FloatingCopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey there! I am your PaisaMind AI Financial Copilot. Ask me about your 44ADA tax savings, cash runway, invoice risks, or simulate large purchases!",
      toolsUsed: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [hasUnread, setHasUnread] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  const handleSend = async (userPrompt) => {
    const queryText = (userPrompt || input).trim();
    if (!queryText || loading) return;

    setInput("");
    const newMessages = [...messages, { role: "user", content: queryText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await copilotService.chat(queryText, conversationId);

      if (res?.success) {
        if (res.data?.conversationId) setConversationId(res.data.conversationId);
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: res.data?.answer || res.data?.message || "I evaluated your financial data.",
            toolsUsed: res.data?.toolCalls || [],
          },
        ]);
      }
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `Error: ${err.message || "Could not complete calculation."}`,
          toolsUsed: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] mb-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Drawer Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <img src="/mascot.png" alt="Copilot Mascot" className="w-8 h-8 rounded-full bg-white/20 p-0.5 object-cover" />
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>PaisaMind Copilot</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">Grounded</span>
                </div>
                <div className="text-[10px] text-white/80">Deterministic Tool Engine</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/copilot"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors"
                title="Open Fullscreen Copilot"
              >
                <Maximize2 size={14} />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl leading-relaxed ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-none shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.content}</p>

                  {/* Tool Badges */}
                  {m.toolsUsed?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[var(--border)] flex flex-wrap gap-1">
                      {m.toolsUsed.map((t, tidx) => (
                        <span
                          key={tidx}
                          className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 text-[9px] font-mono font-bold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl text-xs text-[var(--text-secondary)] w-fit">
                <Loader2 size={13} className="animate-spin text-indigo-500" />
                <span>Running calculation engines...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions (if only welcome message) */}
          {messages.length === 1 && (
            <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-primary)]/50 space-y-1.5">
              <div className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase">Quick Prompts:</div>
              <div className="flex flex-wrap gap-1">
                {SUGGESTED_QUESTIONS.slice(0, 2).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:bg-indigo-500/10 hover:text-indigo-500 text-left transition-colors truncate max-w-full"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-[var(--border)] bg-[var(--bg-elevated)] flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask Copilot (e.g. Can I afford X?)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Sticker Avatar + Trigger Button */}
      <div className="relative flex flex-col items-end">
        {/* Floating Mascot Sticker (Permanent - No Dismiss) */}
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="cursor-pointer mb-[-6px] flex flex-col items-center select-none group transition-transform duration-300 hover:scale-105"
          >
            <div className="px-2.5 py-0.5 rounded-full bg-slate-900/90 backdrop-blur-sm text-indigo-300 text-[10px] font-bold shadow-lg border border-indigo-500/30 mb-1 animate-pulse">
              Ask Copilot
            </div>
            <img
              src="/mascot.png"
              alt="Financial Copilot Mascot"
              className="w-16 h-28 object-contain drop-shadow-2xl animate-bounce hover:animate-none transition-all duration-300 group-hover:-rotate-3 group-hover:scale-110"
              style={{ animationDuration: "2.5s" }}
            />
          </div>
        )}

        {/* Circular Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full bg-slate-900 border-2 border-indigo-500 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden group"
          aria-label="Toggle Financial Copilot"
        >
          {isOpen ? (
            <ChevronDown size={22} className="text-white" />
          ) : (
            <div className="relative flex items-center justify-center w-full h-full p-1.5">
              <img
                src="/mascot.png"
                alt="Copilot Mascot"
                className="w-full h-full object-contain rounded-full transition-transform duration-300 group-hover:scale-110"
              />
              {hasUnread && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-indigo-500 rounded-full ring-2 ring-slate-900 animate-ping" />
              )}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
