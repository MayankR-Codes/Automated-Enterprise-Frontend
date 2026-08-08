import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { mlApi } from "../services/mlApi";
import { SupportTicket, TriagePriority, TicketAuditEntry } from "../types";
import {
  Ticket, PlusCircle, AlertCircle, Clock, CheckCircle2,
  ShieldAlert, RefreshCw, ChevronRight, User, Sparkles,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SupportTicketsManagerProps {
  isAdmin?: boolean;
}

export const SupportTicketsManager: React.FC<SupportTicketsManagerProps> = ({ isAdmin = false }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [auditLogs, setAuditLogs] = useState<TicketAuditEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Ticket Form State
  const [newTitle, setNewTitle] = useState("");
  const [newIssue, setNewIssue] = useState("");
  const [creating, setCreating] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await mlApi.fetchTickets(isAdmin ? undefined : (user?.uid || user?.id));
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [isAdmin, user]);

  const handleSelectTicket = async (t: SupportTicket) => {
    setSelectedTicket(t);
    setLoadingAudit(true);
    try {
      const res = await mlApi.fetchTicketDetails(t.ticket_id);
      if (res.audit_history) {
        setAuditLogs(res.audit_history);
      } else {
        setAuditLogs([]);
      }
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newIssue.trim()) return;

    setCreating(true);
    setFormMsg("");
    try {
      const res = await mlApi.createSupportTicket({
        title: newTitle,
        issue: newIssue,
        user_name: user?.name || "Employee",
        user_email: user?.email || "employee@securegate.ai",
        customer_tier: user?.role === 'executive' ? 'VIP Enterprise' : 'Enterprise',
        user_id: user?.uid || user?.id
      });

      if (res.success && res.ticket) {
        setTickets(prev => [res.ticket!, ...prev]);
        setShowCreateModal(false);
        setNewTitle("");
        setNewIssue("");
      } else {
        setFormMsg(res.message || "Failed to create ticket.");
      }
    } catch (err: any) {
      setFormMsg(err.message || "Failed to create ticket.");
    } finally {
      setCreating(false);
    }
  };

  const getPriorityBadge = (p: TriagePriority) => {
    switch (p) {
      case "P1-Critical":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse flex items-center gap-1"><ShieldAlert size={12} /> P1-Critical</span>;
      case "P2-High":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1"><AlertCircle size={12} /> P2-High</span>;
      case "P3-Medium":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1"><Clock size={12} /> P3-Medium</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30 flex items-center gap-1">P4-Low</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED_RESOLVED":
      case "RESOLVED":
        return <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 size={11} /> Resolved & Dispatched</span>;
      case "TRIAGED_PENDING_APPROVAL":
        return <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1"><Sparkles size={11} /> Triaged (Pending HITL Approval)</span>;
      case "ESCALATED_MANUAL_REVIEW":
        return <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1"><ShieldAlert size={11} /> Escalated Incident</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">Ingested</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Ticket className="text-indigo-400" size={20} />
            {isAdmin ? "Enterprise Support Queue & AI Triage" : "My Support Tickets & Incident Reports"}
          </h2>
          <p className="text-xs text-slate-400">
            Automated ticket classification, SLA routing, and compliance audit trail
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTickets}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all active:scale-95 flex items-center gap-1 text-xs"
            title="Refresh tickets"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>

          {!isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <PlusCircle size={15} /> Submit Support Ticket
            </button>
          )}
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets */}
        <div className={`${selectedTicket ? "lg:col-span-7" : "lg:col-span-12"} space-y-3`}>
          {tickets.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center text-slate-400">
              <Ticket size={36} className="mx-auto mb-3 text-slate-600 opacity-60" />
              <p className="font-semibold text-sm">No support tickets found</p>
              <p className="text-xs text-slate-500 mt-1">Submit an IT or HR ticket or talk to the AI Copilot to get started.</p>
            </div>
          ) : (
            tickets.map((t) => (
              <motion.div
                key={t.ticket_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleSelectTicket(t)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedTicket?.ticket_id === t.ticket_id
                    ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10"
                    : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {t.ticket_id}
                    </span>
                    {getPriorityBadge(t.priority)}
                    {getStatusBadge(t.status)}
                  </div>
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-200 mb-1 line-clamp-1">{t.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{t.issue}</p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Layers size={13} className="text-slate-500" /> {t.assigned_team || "General Queue"}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <User size={13} className="text-slate-500" /> {t.user_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-indigo-400 font-semibold text-[11px]">
                    View Audit & AI Triage <ChevronRight size={13} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Right Column: Ticket Inspection & Audit Trail */}
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5 bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-5 shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs text-indigo-400 font-mono font-bold">{selectedTicket.ticket_id}</span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">{selectedTicket.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* AI Classification Card */}
            <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" /> AI Classification Diagnostics
                </span>
                <span className="text-slate-500 font-mono text-[10px]">Urgency Score: {selectedTicket.urgency_score}/10</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">Category</div>
                  <div className="font-semibold text-slate-200">{selectedTicket.category}</div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">Assigned Team</div>
                  <div className="font-semibold text-slate-200">{selectedTicket.assigned_team}</div>
                </div>
              </div>

              {selectedTicket.draft_response && (
                <div className="p-3 bg-indigo-950/20 rounded-lg border border-indigo-500/20 text-xs text-slate-300">
                  <div className="font-bold text-indigo-300 mb-1 text-[11px]">AI Generated Resolution Draft:</div>
                  <p className="whitespace-pre-wrap leading-relaxed">{selectedTicket.draft_response}</p>
                </div>
              )}
            </div>

            {/* Compliance Audit Trail */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Clock size={13} className="text-indigo-400" /> Immutable Audit History
              </h4>

              {loadingAudit ? (
                <div className="text-xs text-slate-500 py-3 text-center animate-pulse">Loading compliance log events...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center bg-slate-950/40 rounded-lg">No audit events logged yet.</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div key={log.log_id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-300">{log.action}</span>
                        <span className="text-slate-500 font-mono text-[10px]">{log.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">Actor: <span className="text-slate-300">{log.actor}</span></div>
                      {log.reasoning_trace && (
                        <div className="text-[11px] text-slate-400 italic bg-slate-900/60 p-1.5 rounded mt-1 border border-slate-800/50">
                          "{log.reasoning_trace}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Ticket className="text-indigo-400" size={18} /> Submit Support / HR Ticket
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  ✕
                </button>
              </div>

              {formMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                  {formMsg}
                </div>
              )}

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Ticket Title / Summary
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Request 2 Days Medical Leave, VPN disconnection on 3rd floor"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Detailed Issue Description
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newIssue}
                    onChange={(e) => setNewIssue(e.target.value)}
                    placeholder="Provide relevant details. The AI Triage Engine will automatically classify priority (P1-P4), route to the proper department, and compute SLA targets."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/15 flex items-center gap-2 text-xs text-indigo-300">
                  <Sparkles size={16} className="text-amber-400 shrink-0" />
                  <span>Powered by Groq LLM & Triage Skill. Tickets will be automatically ingested and assigned.</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creating ? "Triaging with AI..." : "Create & Triage Ticket"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
