import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { copilotService } from "../services/copilotService";

const PROMPT_CATEGORIES = [
  {
    name: "Tax & 44ADA",
    prompt: "How much tax do I save under Section 44ADA vs New Regime for FY 25-26?",
  },
  {
    name: "Affordability",
    prompt: "Can I afford a ₹70,000 MacBook workstation upgrade right now?",
  },
  {
    name: "Cash Runway",
    prompt: "What is my current cash runway under my expected monthly burn?",
  },
  {
    name: "Risk Audit",
    prompt: "Scan my expenses for spending spikes and duplicate transactions.",
  },
  {
    name: "Invoice Recovery",
    prompt: "Which clients have overdue invoices and pose cash flow risk?",
  },
];

export default function Copilot() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: `### Welcome to Financial Copilot\nI am your deterministic AI financial intelligence engine. Every calculation, runway forecast, Section 44ADA tax reserve, and risk diagnosis is verified against your actual accounts.\n\nSelect a recommended financial decision below or ask any question about your finances.`,
      toolCalls: [],
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [expandedTools, setExpandedTools] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setLoading(true);

    try {
      const res = await copilotService.chat(query, conversationId);
      if (res.success && res.data) {
        if (!conversationId && res.data.conversationId) {
          setConversationId(res.data.conversationId);
        }
        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: res.data.answer || res.data.message,
          toolCalls: res.data.toolCalls || [],
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `**Unable to complete evaluation:** ${err.message || "Could not reach financial engine."}`,
          toolCalls: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setConversationId(null);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `### New Financial Decision Session Started\nAsk me about your tax savings, cash runway, invoice collections, or simulate large purchases!`,
        toolCalls: [],
      },
    ]);
  };

  const toggleToolExpand = (msgId, toolIdx) => {
    const key = `${msgId}_${toolIdx}`;
    setExpandedTools((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 border border-indigo-500/30 overflow-hidden shadow-lg shadow-indigo-500/20">
            <img src="/mascot.png" alt="Mascot" className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
              Financial Copilot
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                20 Deterministic Engines
              </span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Grounded AI Decision Support for Indian Freelancers & Small Businesses
            </p>
          </div>
        </div>

        <button
          onClick={resetChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
        >
          <RotateCcw size={13} />
          <span>New Session</span>
        </button>
      </div>

      {/* Suggested Decision Prompts */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {PROMPT_CATEGORIES.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(item.prompt)}
            disabled={loading}
            className="flex-shrink-0 text-xs px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] hover:border-indigo-500/40 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-1.5"
          >
            <span className="font-semibold text-[var(--text-primary)]">{item.name}</span>
            <ArrowRight size={11} className="opacity-50" />
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-indigo-500/30 overflow-hidden mt-1 shadow-sm">
                <img src="/mascot.png" alt="Mascot" className="w-full h-full object-contain p-0.5" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/15"
                  : "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] shadow-sm"
              }`}
            >
              {/* Tool Execution Badges */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mb-3.5 space-y-2 border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-500 uppercase tracking-wider">
                    <Cpu size={13} />
                    Verified Tools Executed ({msg.toolCalls.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.toolCalls.map((tc, idx) => {
                      const isExpanded = expandedTools[`${msg.id}_${idx}`];
                      return (
                        <div key={idx} className="w-full">
                          <button
                            onClick={() => toggleToolExpand(msg.id, idx)}
                            className="flex items-center justify-between w-full text-xs font-mono px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] hover:border-indigo-500/30 text-[var(--text-secondary)] text-left"
                          >
                            <span className="flex items-center gap-1.5">
                              <FileCheck size={12} className="text-emerald-500" />
                              {tc.name || tc.tool}()
                            </span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                          {isExpanded && (
                            <pre className="mt-1.5 p-2.5 text-[11px] font-mono rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] overflow-x-auto text-[var(--text-secondary)] max-h-48">
                              {JSON.stringify(tc.result || tc.output || tc, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div className="space-y-2.5 whitespace-pre-wrap">
                {msg.content}
              </div>
            </div>

            {msg.role === "user" && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] mt-1">
                <User size={18} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3.5 items-center text-xs text-[var(--text-secondary)] animate-pulse">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-indigo-500/30 overflow-hidden">
              <img src="/mascot.png" alt="Loading" className="w-full h-full object-contain animate-pulse p-0.5" />
            </div>
            <span>Evaluating deterministic financial models & formatting response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative flex items-center gap-2 pt-2 border-t border-[var(--border)]"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask anything (e.g., Can I afford ₹50k equipment? What is my 44ADA tax liability?)..."
          disabled={loading}
          className="flex-1 rounded-xl px-4 py-3.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all pr-12"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="absolute right-2 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all shadow-md shadow-indigo-600/20"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
