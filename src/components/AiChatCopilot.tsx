import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { mlApi } from "../services/mlApi";
import { ChatMessage } from "../types";
import {
  Bot, Send, Sparkles, CheckCircle2, XCircle, RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";

interface AiChatCopilotProps {
  onTicketCreated?: () => void;
  className?: string;
  initialOpen?: boolean;
}

export const AiChatCopilot: React.FC<AiChatCopilotProps> = ({
  onTicketCreated,
  className = ""
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: `Hello **${user?.name || "there"}**! 👋 I am your **Enterprise AI Support & Operations Copilot**.\n\nI can help you with:\n• 🩺 **HR & Leave Applications** *(Instant triage & SLA routing)*\n• 💻 **IT, Network & Hardware Issues** *(Wi-Fi, VPN, cloud outage)*\n• 📚 **Company Policies & Knowledge Base Q&A**\n• 💰 **Business Expenses & Financial Queries**\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentName: "Enterprise AI Copilot"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(() => `session_${user?.uid || user?.id || Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const quickPrompts = [
    { label: "Sick Leave (2 days)", text: "I am feeling unwell today, please apply for sick leave for 2 days." },
    { label: "Office Wi-Fi Issue", text: "The Wi-Fi on floor 3 is disconnecting every 10 minutes." },
    { label: "VPN Connection Drop", text: "My VPN connection keeps timing out when accessing production databases." },
    { label: "Company Leave Policy", text: "What is our company annual leave and sick leave policy?" }
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isSending) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setIsSending(true);

    try {
      const res = await mlApi.sendChatMessage({
        message: query,
        session_id: sessionId,
        user: {
          id: user?.uid || user?.id,
          full_name: user?.name,
          email: user?.email,
          tier: user?.role === 'executive' ? 'VIP Enterprise' : 'Enterprise'
        }
      });

      const botReply = res.output || res.response || "I have received your request.";
      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: "assistant",
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasPendingAction: res.has_pending_action,
        pendingAction: res.pending_action,
        agentName: "Enterprise AI Copilot"
      };

      setMessages(prev => [...prev, assistantMsg]);

      // If user accepted ticket creation and ticket succeeded
      if (query.toLowerCase() === "yes" || botReply.includes("Ticket Created Successfully")) {
        if (onTicketCreated) onTicketCreated();
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "assistant",
        text: "I experienced a temporary communication glitch with the AI server. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmAction = async (confirmed: boolean) => {
    await handleSendMessage(confirmed ? "yes" : "no");
  };

  return (
    <div className={`flex flex-col h-[650px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 shadow-lg shadow-indigo-500/20 text-white">
            <Bot size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm tracking-wide">SecureGate AI Copilot</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Online • RAG + Groq
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous HR & IT Ticket Triage • SLA Routing • Enterprise RAG</p>
          </div>
        </div>
        <button
          onClick={() => setMessages([
            {
              id: `welcome-${Date.now()}`,
              sender: "assistant",
              text: `Chat session refreshed! How can I assist you with HR leave, IT support, or company policies?`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              agentName: "Enterprise AI Copilot"
            }
          ])}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
          title="Reset conversation"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
        <span className="text-slate-500 flex items-center gap-1 shrink-0 font-medium">
          <Sparkles size={13} className="text-amber-400" /> Quick Ask:
        </span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p.text)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700/60 transition-all shrink-0 whitespace-nowrap active:scale-95"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                {!isUser && (
                  <span className="text-[11px] font-bold text-indigo-400 flex items-center gap-1">
                    <Bot size={12} /> {msg.agentName || "AI Copilot"}
                  </span>
                )}
                <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-tr-none font-medium"
                    : "bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed space-y-2">
                  {msg.text}
                </div>

                {/* Interactive Confirmation Card if Pending Action */}
                {msg.hasPendingAction && msg.pendingAction && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 pt-3 border-t border-slate-700/80 space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-indigo-500/20"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-400" /> Pending Action Review
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                        {msg.pendingAction.action_type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Department</div>
                        <div className="font-semibold text-slate-200">{msg.pendingAction.assigned_team || "Human Resources"}</div>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Category</div>
                        <div className="font-semibold text-slate-200">{msg.pendingAction.category}</div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleConfirmAction(true)}
                        disabled={isSending}
                        className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle2 size={15} /> Yes, Submit Official Ticket
                      </button>
                      <button
                        onClick={() => handleConfirmAction(false)}
                        disabled={isSending}
                        className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                      >
                        <XCircle size={15} /> Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}

        {isSending && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-slate-400 text-xs px-2 py-1"
          >
            <div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400">
              <Bot size={14} className="animate-spin" />
            </div>
            <span>AI Copilot is triaging with RAG & reasoning...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask AI Copilot (e.g., 'Apply for sick leave tomorrow', 'Wi-Fi not working')..."
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !inputMessage.trim()}
            className="p-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
