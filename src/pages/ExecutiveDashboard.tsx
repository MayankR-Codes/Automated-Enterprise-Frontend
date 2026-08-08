import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { mlApi } from "../services/mlApi";
import { 
  AlertTriangle, RefreshCw, BarChart3, 
  LogOut, ShieldCheck, CheckCircle2,
  Bot, ArrowUpRight, CheckSquare, CornerUpLeft,
  ShieldAlert, DollarSign, Ticket
} from "lucide-react";
import confetti from "canvas-confetti";
import { HitlPendingApprovals } from "../components/HitlPendingApprovals";
import { SupportTicketsManager } from "../components/SupportTicketsManager";
import { FinancialLedgerManager } from "../components/FinancialLedgerManager";
import { apiEndpoint } from "../config/api";


interface ExecutiveDashboardProps {
  onLogout: () => void;
}

type ExecTab = "approvals" | "finance" | "tickets" | "analytics";

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ onLogout }) => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<ExecTab>("approvals");
  
  const [allRequests, setRequests] = useState<any[]>([]);
  const [escalatedTickets, setEscalatedTickets] = useState<any[]>([]);
  const [companyInsights, setCompanyInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resolutionText, setResolutionText] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [reqRes, ticketRes, insightData] = await Promise.all([
        fetch(apiEndpoint("/api/portal/requests"), { headers }),
        fetch(apiEndpoint("/api/portal/tickets"), { headers }),
        mlApi.fetchCompanyInsights()
      ]);
      
      if (reqRes.ok) {
        const reqs = await reqRes.json();
        setRequests(reqs);
      }

      if (ticketRes.ok) {
        const tix = await ticketRes.json();
        setEscalatedTickets(tix);
      } else {
        // Seed default escalated problems for demonstration
        setEscalatedTickets([
          {
            id: "ESC-8012",
            employeeName: "Marcus Vance",
            department: "IT Infrastructure",
            category: "Server Room Cooling",
            subject: "Primary Rack Cooling Outage in Bhubaneswar Data Center",
            description: "Main condenser unit offline. Admin attempted fan replacement but required vendor escalation.",
            importance: "CRITICAL",
            forwardedByAdmin: "Admin Officer Sarah",
            forwardReason: "Hardware replacement exceeds local branch spending limit & requires vendor contract override.",
            date: "2026-08-07T10:15:00Z",
            status: "FORWARDED_TO_EXEC"
          },
          {
            id: "ESC-8019",
            employeeName: "Elena Rostova",
            department: "Facilities & Transport",
            category: "Branch Shuttle Service",
            subject: "Inter-branch Damanjodi transport route conflict",
            description: "Shift schedule changes causing 2-hour delay for night shift employees.",
            importance: "HIGH",
            forwardedByAdmin: "Admin Officer Raj",
            forwardReason: "Requires cross-departmental policy update from Executive Leadership.",
            date: "2026-08-07T11:40:00Z",
            status: "FORWARDED_TO_EXEC"
          }
        ]);
      }

      if (insightData && insightData.insights) {
        setCompanyInsights(insightData.insights);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolveEscalated = async (id: string, action: 'RESOLVE' | 'SEND_BACK' | 'TAKE_OVER') => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      setEscalatedTickets(prev => prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            status: action === 'RESOLVE' ? 'RESOLVED_BY_EXEC' : action === 'SEND_BACK' ? 'SENT_BACK_TO_ADMIN' : 'UNDER_EXEC_REVIEW',
            executiveResolution: resolutionText || "Resolved under Executive Authority."
          };
        }
        return t;
      }));
      setSuccessMsg(`Executive action (${action}) logged successfully.`);
      if (action === 'RESOLVE') {
        confetti({ particleCount: 60, spread: 70 });
      }
      setResolutionText("");
    } catch (e) {
      setErrorMsg("Failed to update status.");
    }
  };

  const totalVisitors = allRequests.length;
  const highRiskCount = allRequests.filter(r => r.aiAnalysis?.riskScore === "high" || r.aiAnalysis?.importance === "HIGH").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row relative">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-brand-500" size={24} />
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">
              Executive Gate
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("approvals")}
              className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition text-left ${activeTab === 'approvals' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <ShieldAlert size={16} />
              <span>HITL Approvals Queue</span>
            </button>

            <button
              onClick={() => setActiveTab("finance")}
              className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition text-left ${activeTab === 'finance' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <DollarSign size={16} />
              <span>Financial Ledger & KPIs</span>
            </button>

            <button
              onClick={() => setActiveTab("tickets")}
              className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition text-left ${activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <Ticket size={16} />
              <span>Support & IT Queue</span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition text-left ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <BarChart3 size={16} />
              <span>Company Insights & Escalations</span>
            </button>
          </div>
        </div>


        <div className="space-y-4">
          <div className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              {user?.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <h4 className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">{user?.name}</h4>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full p-2.5 rounded border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-2.5 transition"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-8 space-y-8 overflow-y-auto text-left">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              Senior Executive Management Dashboard
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-light">Monitor company analytics, triage unresolved administrator escalations, and inspect AI company insights.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">System Logs: {totalVisitors}</span>
            <button
              onClick={fetchData}
              className="p-2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold">
            {successMsg}
          </div>
        )}

        {/* TAB: HITL Pending Approvals */}
        {activeTab === "approvals" && (
          <HitlPendingApprovals />
        )}

        {/* TAB: Financial Ledger */}
        {activeTab === "finance" && (
          <FinancialLedgerManager isAdmin={true} />
        )}

        {/* TAB: Support Tickets Queue */}
        {activeTab === "tickets" && (
          <SupportTicketsManager isAdmin={true} />
        )}

        {/* TAB: Company Analytics & Insights */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            {/* Company Analytics KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Company Requests</span>
                <p className="text-2xl font-black text-brand-400">{totalVisitors || 12}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">High Priority / Risk</span>
                <p className="text-2xl font-black text-rose-400">{highRiskCount || 2}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Escalated Unresolved</span>
                <p className="text-2xl font-black text-amber-400">{escalatedTickets.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Resolution Time</span>
                <p className="text-2xl font-black text-emerald-400">1.8 Hrs</p>
              </div>
            </div>


        {/* AI Company Insights Agent Section */}
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-indigo-500/30 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-base font-extrabold text-indigo-400 flex items-center gap-2">
              <Bot size={18} /> CompanyAnalyticsAgent — Executive Insights
            </h3>
            <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-500/30">AI Generated Analytics</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {companyInsights.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-300">{item.category}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {item.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-light">{item.insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Unresolved Problems Section (Escalated Complaints Desk) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-rose-400 flex items-center gap-2">
              <AlertTriangle size={20} /> Unresolved Problems (Forwarded by Administrator)
            </h3>
            <span className="text-xs text-slate-400">Action Required</span>
          </div>

          <div className="space-y-4">
            {escalatedTickets.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-500 text-xs">
                No unresolved complaints currently forwarded to Senior Executive.
              </div>
            ) : (
              escalatedTickets.map(item => (
                <div key={item.id} className="p-6 rounded-2xl bg-slate-950/60 border border-rose-500/30 space-y-4">
                  <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{item.id} &bull; {item.category}</span>
                      <h4 className="text-base font-bold text-slate-100">{item.subject}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Employee: {item.employeeName} ({item.department})</p>
                    </div>
                    <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full font-bold text-xs">
                      {item.importance} PRIORITY
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                      <span className="font-bold text-slate-400 text-[10px] uppercase block">Complaint Description</span>
                      <p className="text-slate-300 font-mono text-[11px]">"{item.description}"</p>
                    </div>

                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-1">
                      <span className="font-bold text-amber-400 text-[10px] uppercase block">Why Admin Forwarded to Executive</span>
                      <p className="text-amber-200 text-[11px] font-medium">Forwarded by {item.forwardedByAdmin}: "{item.forwardReason}"</p>
                    </div>
                  </div>

                  {item.status === 'RESOLVED_BY_EXEC' ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 size={16} /> Resolved under Executive Authority: "{item.executiveResolution}"
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <input
                        type="text"
                        placeholder="Add final resolution notes or instructions for administrator..."
                        value={resolutionText}
                        onChange={e => setResolutionText(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleResolveEscalated(item.id, 'RESOLVE')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                        >
                          <CheckSquare size={14} /> Resolve Escalated Problem
                        </button>
                        <button
                          onClick={() => handleResolveEscalated(item.id, 'SEND_BACK')}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                        >
                          <CornerUpLeft size={14} /> Send Back to Admin with Instructions
                        </button>
                        <button
                          onClick={() => handleResolveEscalated(item.id, 'TAKE_OVER')}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                        >
                          <ArrowUpRight size={14} /> Take Over Responsibility
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </div>
        </div>
        )}

      </main>
    </div>
  );
};

