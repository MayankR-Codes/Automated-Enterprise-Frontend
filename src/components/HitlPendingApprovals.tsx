import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { mlApi } from "../services/mlApi";
import { SupportTicket, AdminOperationalAnalytics } from "../types";
import {
  ShieldAlert, CheckCircle2, AlertTriangle, Send,
  Sparkles, RefreshCw, Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

export const HitlPendingApprovals: React.FC = () => {
  const { user } = useAuth();
  const [pendingTickets, setPendingTickets] = useState<SupportTicket[]>([]);
  const [analytics, setAnalytics] = useState<AdminOperationalAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editedDrafts, setEditedDrafts] = useState<Record<string, string>>({});
  const [reviewerNotes, setReviewerNotes] = useState<Record<string, string>>({});
  const [escalateModalTicket, setEscalateModalTicket] = useState<SupportTicket | null>(null);
  const [escalationReason, setEscalationReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadPending = async () => {
    setLoading(true);
    try {
      const [tickets, analyticsData] = await Promise.all([
        mlApi.fetchPendingApprovals(),
        mlApi.fetchAdminAnalytics()
      ]);
      setPendingTickets(tickets);
      setAnalytics(analyticsData);

      // Pre-fill edited drafts
      const drafts: Record<string, string> = {};
      tickets.forEach((t) => {
        if (t.draft_response) {
          drafts[t.ticket_id] = t.draft_response;
        }
      });
      setEditedDrafts(drafts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (ticket: SupportTicket) => {
    setProcessingId(ticket.ticket_id);
    setActionSuccess(null);
    try {
      const draft = editedDrafts[ticket.ticket_id] || ticket.draft_response;
      const notes = reviewerNotes[ticket.ticket_id] || "Approved by Admin.";
      const res = await mlApi.approveTicket(
        ticket.ticket_id,
        user?.name || "Admin Reviewer",
        draft,
        notes
      );

      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
        setActionSuccess(`Ticket ${ticket.ticket_id} approved and dispatched successfully!`);
        setPendingTickets(prev => prev.filter(t => t.ticket_id !== ticket.ticket_id));
        loadPending();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleEscalateConfirm = async () => {
    if (!escalateModalTicket) return;
    setProcessingId(escalateModalTicket.ticket_id);
    try {
      const res = await mlApi.escalateTicket(
        escalateModalTicket.ticket_id,
        user?.name || "Admin Reviewer",
        escalationReason || "Escalated for senior incident bridge."
      );
      if (res.success) {
        setActionSuccess(`Ticket ${escalateModalTicket.ticket_id} escalated for Incident Bridge.`);
        setPendingTickets(prev => prev.filter(t => t.ticket_id !== escalateModalTicket.ticket_id));
        setEscalateModalTicket(null);
        setEscalationReason("");
        loadPending();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="text-amber-400" size={22} />
              Human-in-the-Loop (HITL) Pending Approvals Queue
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold font-mono">
              {pendingTickets.length} Pending Sign-Off
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Review AI draft responses, edit messages before dispatch, or escalate critical incidents
          </p>
        </div>

        <button
          onClick={loadPending}
          disabled={loading}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Queue
        </button>
      </div>

      {/* Analytics KPI Row */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-xs font-semibold">Total Processed</div>
            <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">{analytics.total_tickets}</div>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-xs font-semibold">AI Automation Rate</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{analytics.automation_rate}</div>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-xs font-semibold">Resolved & Dispatched</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">{analytics.approved_count}</div>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-xs font-semibold">Escalated Incidents</div>
            <div className="text-2xl font-bold text-red-400 mt-1 font-mono">{analytics.escalated_count}</div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {actionSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center justify-between"
        >
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-white">✕</button>
        </motion.div>
      )}

      {/* Queue List */}
      {pendingTickets.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-400">
          <CheckCircle2 size={42} className="mx-auto mb-3 text-emerald-400 opacity-80" />
          <h3 className="font-bold text-base text-slate-200">Approval Queue is Clean!</h3>
          <p className="text-xs text-slate-500 mt-1">All AI triaged tickets have been reviewed and dispatched to employees.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingTickets.map((ticket) => (
            <motion.div
              key={ticket.ticket_id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5"
            >
              {/* Header Details */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {ticket.ticket_id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      ticket.priority === 'P1-Critical'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                        : ticket.priority === 'P2-High'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {ticket.priority}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                      {ticket.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-100 pt-1">{ticket.title}</h3>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <div>Requester: <span className="text-slate-200 font-semibold">{ticket.user_name}</span> ({ticket.user_email})</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Assigned Team: <span className="text-indigo-400 font-medium">{ticket.assigned_team}</span></div>
                </div>
              </div>

              {/* Requester Issue Statement */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Submitted Request / Issue:
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{ticket.issue}</p>
              </div>

              {/* AI Draft Response & Editor */}
              <div className="space-y-2 bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles size={14} className="text-amber-400" /> AI Drafted Customer Response (Live Editable)
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Edit3 size={12} /> Edit before dispatching
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={editedDrafts[ticket.ticket_id] || ticket.draft_response || ""}
                  onChange={(e) => setEditedDrafts(prev => ({ ...prev, [ticket.ticket_id]: e.target.value }))}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed"
                />

                {ticket.internal_notes && (
                  <div className="text-xs text-slate-400 pt-1 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-300">Internal AI Diagnostics:</span> {ticket.internal_notes}
                  </div>
                )}
              </div>

              {/* Reviewer Notes & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <input
                  type="text"
                  placeholder="Optional internal reviewer notes / rationale..."
                  value={reviewerNotes[ticket.ticket_id] || ""}
                  onChange={(e) => setReviewerNotes(prev => ({ ...prev, [ticket.ticket_id]: e.target.value }))}
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                />

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEscalateModalTicket(ticket)}
                    disabled={processingId === ticket.ticket_id}
                    className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <AlertTriangle size={15} /> Escalate Incident
                  </button>

                  <button
                    onClick={() => handleApprove(ticket)}
                    disabled={processingId === ticket.ticket_id}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Send size={15} />
                    {processingId === ticket.ticket_id ? "Dispatching..." : "Approve & Dispatch Mail"}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Escalate Modal */}
      <AnimatePresence>
        {escalateModalTicket && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-red-500/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-base text-red-400 flex items-center gap-2">
                  <ShieldAlert size={18} /> Escalate to Incident Bridge
                </h3>
                <button onClick={() => setEscalateModalTicket(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Escalating <span className="font-mono text-white font-bold">{escalateModalTicket.ticket_id}</span> will bypass standard automated dispatch and page the On-Call Engineering / HR Director bridge.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Escalation Reason & Notes
                </label>
                <textarea
                  rows={3}
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder="e.g. Critical cloud outage affecting 500+ users, requires executive sign-off."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEscalateModalTicket(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEscalateConfirm}
                  disabled={processingId === escalateModalTicket.ticket_id}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5"
                >
                  Confirm Escalation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
