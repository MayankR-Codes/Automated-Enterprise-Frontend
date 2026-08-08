import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Users, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Settings,
  Search, ShieldCheck, Download, Plus, Trash2, LogOut,
  FileText, BarChart3, Ticket, UserCog, Eye, Shield,
  Lock, Unlock, Building2, Activity, ShieldAlert, DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { HitlPendingApprovals } from "../components/HitlPendingApprovals";
import { SupportTicketsManager } from "../components/SupportTicketsManager";
import { FinancialLedgerManager } from "../components/FinancialLedgerManager";
import { apiEndpoint } from "../config/api";


interface AdminDashboardProps {
  onLogout: () => void;
}

type AdminTab = "approvals" | "support_queue" | "finance" | "control" | "requests" | "tickets" | "audit" | "analytics" | "users";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("approvals");

  const [loading, setLoading] = useState(false);

  // Control Center state
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newBannedName, setNewBannedName] = useState("");
  const [newBannedId, setNewBannedId] = useState("");
  const [newWhitelisted, setNewWhitelisted] = useState("");
  const [riskThreshold, setRiskThreshold] = useState("0.65");
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [configSuccess, setConfigSuccess] = useState("");

  // Requests
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [reqFilter, setReqFilter] = useState("all");
  const [reqSearch, setReqSearch] = useState("");
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideNote, setOverrideNote] = useState("");

  // Tickets
  const [tickets, setTickets] = useState<any[]>([]);

  // Audit Logs
  const [logs, setLogs] = useState<any[]>([]);
  const [logSearch, setLogSearch] = useState("");

  // Analytics
  const [analytics, setAnalytics] = useState<any>(null);

  // Users
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Fetch everything
  const fetchAll = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [reqRes, ticketRes, logRes, analyticsRes, usersRes, listsRes, configRes] = await Promise.all([
        fetch(apiEndpoint("/api/portal/requests"), { headers }),
        fetch(apiEndpoint("/api/portal/tickets"), { headers }),
        fetch(apiEndpoint("/api/portal/audit-logs"), { headers }),
        fetch(apiEndpoint("/api/portal/analytics"), { headers }),
        fetch(apiEndpoint("/api/portal/users"), { headers }),
        fetch(apiEndpoint("/api/portal/system-lists"), { headers }),
        fetch(apiEndpoint("/api/portal/config"), { headers }),
      ]);
      if (reqRes.ok) setRequests(await reqRes.json());
      if (ticketRes.ok) setTickets(await ticketRes.json());
      if (logRes.ok) setLogs(await logRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (usersRes.ok) setAllUsers(await usersRes.json());
      if (listsRes.ok) {
        const data = await listsRes.json();
        setBlacklist(data.blacklist || []);
        setWhitelist(data.whitelist || []);
      }
      if (configRes.ok) {
        const cfg = await configRes.json();
        setRiskThreshold(cfg.riskThreshold?.toString() || "0.65");
        setAutoEscalate(cfg.autoEscalateHighRisk ?? true);
        setMfaEnabled(cfg.mfaEnabled ?? true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Config save
  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSuccess("");
    try {
      const res = await fetch(apiEndpoint("/api/portal/config"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ riskThreshold: Number(riskThreshold), autoEscalateHighRisk: autoEscalate, mfaEnabled }),
      });
      if (res.ok) { setConfigSuccess("Configuration saved successfully!"); setTimeout(() => setConfigSuccess(""), 3000); }
    } catch (e) { console.error(e); }
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannedName.trim()) return;
    await fetch(apiEndpoint("/api/portal/blacklist"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newBannedName, idNumber: newBannedId, action: "add" }),
    });
    setNewBannedName(""); setNewBannedId(""); fetchAll();
  };

  const handleRemoveBlacklist = async (name: string) => {
    await fetch(apiEndpoint("/api/portal/blacklist"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, action: "remove" }),
    });
    fetchAll();
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhitelisted.trim()) return;
    await fetch(apiEndpoint("/api/portal/whitelist"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ entry: newWhitelisted, action: "add" }),
    });
    setNewWhitelisted(""); fetchAll();
  };

  const handleRemoveWhitelist = async (entry: string) => {
    await fetch(apiEndpoint("/api/portal/whitelist"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ entry, action: "remove" }),
    });
    fetchAll();
  };

  const handleAdminOverride = async (requestId: string, approved: boolean) => {
    setOverrideLoading(true);
    await fetch(apiEndpoint("/api/portal/update-approval"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ requestId, approved, notes: overrideNote || "Admin override.", role: "admin" }),
    });
    if (approved) confetti({ particleCount: 60, spread: 80, colors: ["#b87d43", "#9a6334"] });
    setSelectedReq(null);
    setOverrideNote("");
    setOverrideLoading(false);
    fetchAll();
  };

  const handleResolveTicket = async (id: string, status: string) => {
    await fetch(apiEndpoint(`/api/portal/tickets/${id}/resolve`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };

  const handleUserUpdate = async (uid: string, updates: object) => {
    await fetch(apiEndpoint(`/api/portal/users/${uid}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    fetchAll();
  };

  const exportCSV = () => {
    const headers = ["Timestamp", "User Email", "Role", "Action", "Status"];
    const rows = logs.map(l => [l.timestamp, l.userEmail, l.role, l.action, l.status]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `AuditLogs_${Date.now()}.csv`; a.click();
  };

  const getRiskBadge = (score: string) => {
    if (score === "high") return <span className="badge-high">⚠ High</span>;
    if (score === "medium") return <span className="badge-medium">~ Med</span>;
    return <span className="badge-low">✓ Low</span>;
  };

  const getStatusBadge = (status: string) => {
    const m: Record<string, string> = {
      approved: "badge-approved", rejected: "badge-rejected",
      checked_in: "badge-approved", checked_out: "badge-low",
      pending_approval: "badge-pending", pending_verification: "badge-pending"
    };
    return <span className={m[status] || "badge-pending"}>{status?.replace("_", " ")}</span>;
  };

  const filteredRequests = requests.filter(r => {
    const matchStatus = reqFilter === "all" || r.status === reqFilter;
    const matchSearch = !reqSearch || r.visitorName.toLowerCase().includes(reqSearch.toLowerCase()) || r.company?.toLowerCase().includes(reqSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  const filteredLogs = logs.filter(l =>
    !logSearch || l.userEmail?.toLowerCase().includes(logSearch.toLowerCase()) || l.action?.toLowerCase().includes(logSearch.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u =>
    !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const navItems: { key: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "approvals", label: "HITL Approvals Queue", icon: <ShieldAlert size={17} className="text-amber-400" /> },
    { key: "support_queue", label: "Support & IT Queue", icon: <Ticket size={17} className="text-indigo-400" /> },
    { key: "finance", label: "Financial Ledger", icon: <DollarSign size={17} className="text-emerald-400" /> },
    { key: "control", label: "Control Center", icon: <Settings size={17} /> },
    { key: "requests", label: "All Requests", icon: <Users size={17} />, count: requests.length },
    { key: "tickets", label: "HR Tickets", icon: <Ticket size={17} />, count: tickets.filter(t => t.status === "open").length },
    { key: "audit", label: "Audit Logs", icon: <FileText size={17} /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 size={17} /> },
    { key: "users", label: "User Management", icon: <UserCog size={17} />, count: allUsers.length },
  ];

  return (
    <div className="min-h-screen bg-warm-mesh dark:bg-slate-900 text-sand-900 dark:text-slate-100 flex flex-col md:flex-row font-sans">

      {/* ── Sidebar ── */}
      <aside className="w-full md:w-64 bg-sidebar dark:bg-slate-950 border-r border-warm-200 dark:border-slate-800 flex flex-col justify-between shrink-0 p-5">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-9 h-9 rounded-xl bg-brown-gradient flex items-center justify-center shadow-warm">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-brand-800 tracking-tight">SecureGate AI</p>
              <p className="text-[9px] text-sand-400 font-semibold uppercase tracking-widest">Admin Portal</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={activeTab === item.key ? "sidebar-item-active w-full text-left" : "sidebar-item w-full text-left"}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {(item.count ?? 0) > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === item.key ? "bg-brand-200 text-brand-800" : "bg-warm-200 text-sand-600"}`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* KPI mini strip */}
          {analytics && (
            <div className="space-y-2 pt-2">
              <p className="text-[10px] font-bold text-sand-400 uppercase tracking-widest px-1">Live KPIs</p>
              {[
                { l: "Total Visits", v: analytics.total, c: "text-brand-700" },
                { l: "Approved", v: analytics.approved, c: "text-sage-600" },
                { l: "High Risk", v: analytics.riskCounts?.high || 0, c: "text-rust-600" },
              ].map(k => (
                <div key={k.l} className="flex justify-between items-center px-3 py-2 bg-white rounded-xl border border-warm-100 shadow-warm-sm">
                  <span className="text-[11px] text-sand-500 font-medium">{k.l}</span>
                  <span className={`font-black text-sm ${k.c}`}>{k.v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 pt-4">
          <div className="p-3 bg-white rounded-xl border border-warm-200 shadow-warm-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brown-gradient flex items-center justify-center text-white font-black text-xs shadow-warm">
              {user?.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-sand-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-sand-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rust-200 bg-rust-50 hover:bg-rust-100 text-rust-600 font-bold text-xs transition"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-sand-900 dark:text-slate-100">
              {activeTab === "approvals" && "HITL Pending Approvals"}
              {activeTab === "support_queue" && "Support & Incident Queue"}
              {activeTab === "finance" && "Financial Ledger & Approvals"}
              {activeTab === "control" && "Control Center"}
              {activeTab === "requests" && "All Visitor Requests"}
              {activeTab === "tickets" && "HR Ticket Management"}
              {activeTab === "audit" && "Immutable Audit Log"}
              {activeTab === "analytics" && "Analytics & Insights"}
              {activeTab === "users" && "User Management"}
            </h1>
            <p className="text-sm text-sand-400 mt-0.5 font-medium">
              {activeTab === "approvals" && "Human-in-the-Loop review, live draft editing, and automated ticket dispatch."}
              {activeTab === "support_queue" && "Triaged employee tickets, urgency metrics, and AI diagnostics."}
              {activeTab === "finance" && "Company ledger accounting, expense approval workflows, and revenue metrics."}
              {activeTab === "control" && "Configure AI policies, blacklist rules, and security thresholds."}
              {activeTab === "requests" && "Oversee all visitor requests with admin override capability."}
              {activeTab === "tickets" && "Review and resolve employee-raised HR tickets."}
              {activeTab === "audit" && "Tamper-proof log of all system and AI actions."}
              {activeTab === "analytics" && "Visual insights on visit volumes, risk trends, and departments."}
              {activeTab === "users" && "Manage roles, lock accounts, and view all registered users."}
            </p>
          </div>
          <button onClick={fetchAll} disabled={loading} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-warm-200 dark:border-slate-700 hover:bg-warm-50 text-brand-600 shadow-warm-sm transition">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </motion.div>

        {/* ── TAB: HITL APPROVALS ── */}
        {activeTab === "approvals" && (
          <HitlPendingApprovals />
        )}

        {/* ── TAB: SUPPORT QUEUE ── */}
        {activeTab === "support_queue" && (
          <SupportTicketsManager isAdmin={true} />
        )}

        {/* ── TAB: FINANCIAL LEDGER ── */}
        {activeTab === "finance" && (
          <FinancialLedgerManager isAdmin={true} />
        )}


        {/* ── TAB: CONTROL CENTER ── */}
        {activeTab === "control" && (
          <AnimatePresence mode="wait">
            <motion.div key="control" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-12 gap-6">

              {/* AI Config */}
              <div className="lg:col-span-4 space-y-5">
                <div className="card-warm space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-warm-100">
                    <div className="p-2 bg-brand-50 rounded-xl"><Settings size={18} className="text-brand-600" /></div>
                    <h3 className="font-black text-sand-900 text-sm">AI Policy Thresholds</h3>
                  </div>
                  <form onSubmit={handleUpdateConfig} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-sand-500 uppercase block mb-1">Risk Tolerance (0.1 – 0.9)</label>
                      <input type="number" step="0.05" min="0.1" max="0.9" value={riskThreshold} onChange={e => setRiskThreshold(e.target.value)} className="input-warm" />
                      <p className="text-[10px] text-sand-400 mt-1">Lower = stricter flagging.</p>
                    </div>
                    <div className="space-y-3 pt-1">
                      {[
                        { label: "Auto-Escalate High Risk Requests", state: autoEscalate, setState: setAutoEscalate },
                        { label: "Force MFA Email OTP on Login", state: mfaEnabled, setState: setMfaEnabled },
                      ].map(toggle => (
                        <label key={toggle.label} className="flex items-center gap-3 cursor-pointer group">
                          <div
                            onClick={() => toggle.setState(!toggle.state)}
                            className={`w-10 h-5 rounded-full transition-all duration-200 flex items-center px-0.5 ${toggle.state ? "bg-brand-600" : "bg-warm-300"}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${toggle.state ? "translate-x-5" : "translate-x-0"}`} />
                          </div>
                          <span className="text-xs font-semibold text-sand-700">{toggle.label}</span>
                        </label>
                      ))}
                    </div>
                    {configSuccess && <p className="text-xs text-sage-600 font-bold">{configSuccess}</p>}
                    <button type="submit" className="btn-primary w-full">Save Configuration</button>
                  </form>
                </div>
              </div>

              {/* Blacklist + Whitelist */}
              <div className="lg:col-span-8 space-y-5">
                <div className="card-warm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-warm-100">
                    <div className="p-2 bg-rust-50 rounded-xl"><AlertTriangle size={18} className="text-rust-600" /></div>
                    <h3 className="font-black text-sand-900 text-sm">Security Blacklist</h3>
                  </div>
                  <form onSubmit={handleAddBlacklist} className="flex gap-2">
                    <input type="text" required placeholder="Banned Name" value={newBannedName} onChange={e => setNewBannedName(e.target.value)} className="input-warm flex-1" />
                    <input type="text" placeholder="ID Number (opt.)" value={newBannedId} onChange={e => setNewBannedId(e.target.value)} className="input-warm w-36" />
                    <button type="submit" className="btn-danger px-4 flex items-center gap-1.5"><Plus size={14} /> Add</button>
                  </form>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {blacklist.length === 0 && <p className="text-xs text-sand-400 text-center py-3">No entries in blacklist.</p>}
                    {blacklist.map((b, i) => (
                      <div key={i} className="flex justify-between items-center px-3.5 py-2.5 bg-rust-50 border border-rust-100 rounded-xl text-sm">
                        <div>
                          <span className="font-bold text-rust-700">{b.name}</span>
                          {b.idNumber && <span className="text-xs text-rust-400 ml-2 font-mono">{b.idNumber}</span>}
                        </div>
                        <button onClick={() => handleRemoveBlacklist(b.name)} className="text-rust-300 hover:text-rust-600 transition p-1"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-warm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-warm-100">
                    <div className="p-2 bg-sage-50 rounded-xl"><ShieldCheck size={18} className="text-sage-600" /></div>
                    <h3 className="font-black text-sand-900 text-sm">Whitelisted Domains / Emails</h3>
                  </div>
                  <form onSubmit={handleAddWhitelist} className="flex gap-2">
                    <input type="text" required placeholder="e.g. partner.org or user@company.com" value={newWhitelisted} onChange={e => setNewWhitelisted(e.target.value)} className="input-warm flex-1" />
                    <button type="submit" className="btn-success px-4 flex items-center gap-1.5"><Plus size={14} /> Add</button>
                  </form>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {whitelist.length === 0 && <p className="text-xs text-sand-400 text-center py-3">No whitelist entries.</p>}
                    {whitelist.map((w, i) => (
                      <div key={i} className="flex justify-between items-center px-3.5 py-2.5 bg-sage-50 border border-sage-100 rounded-xl text-sm">
                        <span className="font-semibold text-sage-700">{w}</span>
                        <button onClick={() => handleRemoveWhitelist(w)} className="text-sage-300 hover:text-rust-600 transition p-1"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── TAB: ALL REQUESTS ── */}
        {activeTab === "requests" && (
          <AnimatePresence mode="wait">
            <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-48 bg-white border border-warm-200 rounded-xl px-3.5 py-2.5 shadow-warm-sm">
                  <Search size={15} className="text-sand-400 shrink-0" />
                  <input placeholder="Search visitor or company..." value={reqSearch} onChange={e => setReqSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none text-sand-800 placeholder:text-sand-400" />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {["all", "pending_approval", "approved", "rejected", "checked_in"].map(s => (
                    <button key={s} onClick={() => setReqFilter(s)} className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${reqFilter === s ? "bg-brand-600 text-white border-brand-600" : "bg-white text-sand-500 border-warm-200 hover:border-brand-300 hover:text-brand-600"}`}>
                      {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card-warm overflow-hidden p-0">
                <table className="w-full">
                  <thead>
                    <tr>
                      {["Visitor", "Host Employee", "Scheduled", "Room", "AI Risk", "Status", "Action"].map(h => (
                        <th key={h} className="table-header text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.length === 0 && (
                      <tr><td colSpan={7} className="px-5 py-12 text-center text-sand-400 text-sm">No requests match your filters.</td></tr>
                    )}
                    {filteredRequests.map(req => (
                      <tr key={req.id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center gap-2.5">
                            <img src={req.photoUrl} className="w-8 h-8 rounded-full object-cover border border-warm-200" />
                            <div>
                              <p className="font-bold text-sand-900 text-xs">{req.visitorName}</p>
                              <p className="text-[10px] text-sand-400">{req.company}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell text-xs font-medium">{req.meetingDetails.employeeName}</td>
                        <td className="table-cell text-xs font-mono">{new Date(req.meetingDetails.scheduledTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="table-cell text-xs text-brand-600 font-semibold">{req.meetingDetails.roomAllocation}</td>
                        <td className="table-cell">{getRiskBadge(req.aiAnalysis?.riskScore || "low")}</td>
                        <td className="table-cell">{getStatusBadge(req.status)}</td>
                        <td className="table-cell">
                          <button onClick={() => { setSelectedReq(req); setOverrideNote(""); }} className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-800 transition">
                            <Eye size={13} /> Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── TAB: TICKETS ── */}
        {activeTab === "tickets" && (
          <AnimatePresence mode="wait">
            <motion.div key="tickets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {tickets.length === 0 ? (
                <div className="card-warm text-center py-16">
                  <Ticket size={40} className="text-warm-300 mx-auto mb-3" />
                  <p className="text-sand-500 font-semibold">No tickets in the system yet</p>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {tickets.map((t, i) => (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card-warm space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex gap-2 flex-wrap mb-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${t.type === "flag_visitor" ? "badge-high" : t.type === "escalate" ? "badge-medium" : "badge-pending"}`}>
                              {t.type.replace("_", " ")}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${t.status === "open" ? "badge-pending" : "badge-approved"}`}>
                              {t.status}
                            </span>
                          </div>
                          <p className="text-sm text-sand-800 font-medium leading-relaxed">{t.message}</p>
                          <p className="text-[10px] text-sand-400 font-mono mt-2">Raised: {new Date(t.createdAt).toLocaleString()}</p>
                        </div>
                        {t.status === "resolved" && <CheckCircle2 size={20} className="text-sage-500 shrink-0" />}
                      </div>
                      {t.status === "open" && (
                        <div className="flex gap-2 pt-2 border-t border-warm-100">
                          <button onClick={() => handleResolveTicket(t.id, "resolved")} className="btn-success text-xs flex-1">Resolve</button>
                          <button onClick={() => handleResolveTicket(t.id, "closed")} className="btn-secondary text-xs flex-1">Close</button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── TAB: AUDIT LOGS ── */}
        {activeTab === "audit" && (
          <AnimatePresence mode="wait">
            <motion.div key="audit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex items-center gap-2 flex-1 bg-white border border-warm-200 rounded-xl px-3.5 py-2.5 shadow-warm-sm">
                  <Search size={15} className="text-sand-400" />
                  <input placeholder="Search by email or action..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none text-sand-800 placeholder:text-sand-400" />
                </div>
                <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
                  <Download size={14} /> Export CSV
                </button>
              </div>

              <div className="card-warm overflow-hidden p-0">
                <table className="w-full">
                  <thead>
                    <tr>
                      {["Timestamp", "User", "Role", "Action", "Status"].map(h => (
                        <th key={h} className="table-header text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-sand-400 text-sm">No log entries found.</td></tr>}
                    {filteredLogs.map(log => (
                      <tr key={log.id} className={`table-row ${log.status === "failure" ? "bg-rust-50/50" : ""}`}>
                        <td className="table-cell font-mono text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="table-cell font-bold text-sand-900 text-xs">{log.userEmail}</td>
                        <td className="table-cell capitalize text-xs text-sand-500">{log.role}</td>
                        <td className="table-cell font-semibold text-brand-600 text-xs">{log.action}</td>
                        <td className="table-cell">
                          <span className={log.status === "success" ? "badge-approved" : "badge-rejected"}>{log.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── TAB: ANALYTICS ── */}
        {activeTab === "analytics" && analytics && (
          <AnimatePresence mode="wait">
            <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

              {/* KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Visitors", value: analytics.total, icon: <Users size={22} className="text-brand-500" />, bg: "bg-brand-50 border-brand-200" },
                  { label: "Approved", value: analytics.approved, icon: <CheckCircle2 size={22} className="text-sage-500" />, bg: "bg-sage-50 border-sage-200" },
                  { label: "Rejected", value: analytics.rejected, icon: <XCircle size={22} className="text-rust-500" />, bg: "bg-rust-50 border-rust-200" },
                  { label: "High Risk Flags", value: analytics.riskCounts?.high || 0, icon: <AlertTriangle size={22} className="text-amber-500" />, bg: "bg-amber-50 border-amber-200" },
                ].map((kpi, i) => (
                  <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className={`p-5 rounded-2xl border ${kpi.bg} shadow-warm-sm`}>
                    <div className="flex items-start justify-between mb-3">
                      {kpi.icon}
                    </div>
                    <p className="text-3xl font-black text-sand-900">{kpi.value}</p>
                    <p className="text-xs text-sand-500 font-semibold mt-1">{kpi.label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Risk Distribution */}
                <div className="card-warm space-y-4">
                  <h3 className="font-black text-sand-900 text-sm flex items-center gap-2">
                    <Activity size={16} className="text-brand-500" /> Risk Distribution
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Low Risk", count: analytics.riskCounts?.low || 0, total: analytics.total, color: "bg-sage-400", textColor: "text-sage-700" },
                      { label: "Medium Risk", count: analytics.riskCounts?.medium || 0, total: analytics.total, color: "bg-amber-400", textColor: "text-amber-700" },
                      { label: "High Risk", count: analytics.riskCounts?.high || 0, total: analytics.total, color: "bg-rust-500", textColor: "text-rust-700" },
                    ].map(r => (
                      <div key={r.label}>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className={r.textColor}>{r.label}</span>
                          <span className="text-sand-500">{r.count} / {r.total}</span>
                        </div>
                        <div className="h-3 bg-warm-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: r.total > 0 ? `${(r.count / r.total) * 100}%` : "0%" }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                            className={`h-full rounded-full ${r.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Traffic */}
                <div className="card-warm space-y-4">
                  <h3 className="font-black text-sand-900 text-sm flex items-center gap-2">
                    <BarChart3 size={16} className="text-brand-500" /> Weekly Visit Volume
                  </h3>
                  <div className="flex items-end gap-2 h-32">
                    {(analytics.weeklyTraffic || [0,0,0,0,0,0,0]).map((v: number, i: number) => {
                      const maxVal = Math.max(...(analytics.weeklyTraffic || [1]), 1);
                      const pct = v > 0 ? Math.max((v / maxVal) * 100, 8) : 4;
                      const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                          <span className="text-[10px] font-bold text-sand-500">{v}</span>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${pct}%` }}
                            transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }}
                            className="w-full rounded-t-lg bg-brand-gradient"
                            style={{ background: `linear-gradient(to top, #9a6334, #cb9a64)` }}
                          />
                          <span className="text-[9px] text-sand-400 font-semibold">{days[i]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Departments */}
                <div className="card-warm space-y-4 lg:col-span-2">
                  <h3 className="font-black text-sand-900 text-sm flex items-center gap-2">
                    <Building2 size={16} className="text-brand-500" /> Department Visit Activity
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(analytics.departmentVisits || {}).length === 0 ? (
                      <p className="text-sm text-sand-400 col-span-3 text-center py-4">No department data yet.</p>
                    ) : Object.entries(analytics.departmentVisits || {}).slice(0, 6).map(([dept, count]: [string, any]) => (
                      <div key={dept} className="flex items-center justify-between p-3.5 bg-warm-50 border border-warm-200 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                            <Building2 size={14} className="text-brand-600" />
                          </div>
                          <span className="text-xs font-bold text-sand-800">{dept}</span>
                        </div>
                        <span className="text-sm font-black text-brand-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── TAB: USERS ── */}
        {activeTab === "users" && (
          <AnimatePresence mode="wait">
            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center gap-2 bg-white border border-warm-200 rounded-xl px-3.5 py-2.5 shadow-warm-sm max-w-sm">
                <Search size={15} className="text-sand-400" />
                <input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none text-sand-800 placeholder:text-sand-400" />
              </div>

              <div className="card-warm overflow-hidden p-0">
                <table className="w-full">
                  <thead>
                    <tr>{["User", "Role", "Status", "Department", "Actions"].map(h => (<th key={h} className="table-header text-left">{h}</th>))}</tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-sand-400 text-sm">No users found.</td></tr>}
                    {filteredUsers.map(u => (
                      <tr key={u.uid} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-brown-gradient flex items-center justify-center text-white font-black text-[10px] shadow-warm-sm">
                              {u.name?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sand-900 text-xs">{u.name}</p>
                              <p className="text-[10px] text-sand-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            u.role === "admin" ? "bg-brand-50 text-brand-700 border-brand-200" :
                            u.role === "executive" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            u.role === "employee" ? "bg-sage-50 text-sage-700 border-sage-200" :
                            "badge-pending"
                          }`}>{u.role}</span>
                        </td>
                        <td className="table-cell">
                          <span className={u.status === "active" ? "badge-approved" : "badge-rejected"}>{u.status}</span>
                        </td>
                        <td className="table-cell text-xs text-sand-500">{u.details?.department || "—"}</td>
                        <td className="table-cell">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUserUpdate(u.uid, { status: u.status === "active" ? "locked" : "active" })}
                              className={`p-1.5 rounded-lg transition ${u.status === "active" ? "hover:bg-rust-50 text-sand-400 hover:text-rust-600" : "hover:bg-sage-50 text-sand-400 hover:text-sage-600"}`}
                              title={u.status === "active" ? "Lock Account" : "Unlock Account"}
                            >
                              {u.status === "active" ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* ── Admin Override Drawer ── */}
      <AnimatePresence>
        {selectedReq && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-sand-900/30 backdrop-blur-sm"
            onClick={() => setSelectedReq(null)}
          >
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              onClick={e => e.stopPropagation()}
              className="absolute inset-y-0 right-0 w-full max-w-lg bg-white border-l border-warm-200 shadow-warm-xl flex flex-col"
            >
              <div className="p-6 border-b border-warm-100 flex justify-between items-center bg-warm-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-100 rounded-xl"><Shield size={20} className="text-brand-600" /></div>
                  <div>
                    <h3 className="font-black text-sand-900">Admin Review & Override</h3>
                    <p className="text-xs text-sand-400">Full administrative control</p>
                  </div>
                </div>
                <button onClick={() => setSelectedReq(null)} className="p-2 hover:bg-warm-200 rounded-xl text-sand-400 hover:text-sand-700 transition">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="bg-warm-50 border border-warm-200 rounded-2xl p-5 flex items-center gap-4">
                  <img src={selectedReq.photoUrl} className="w-14 h-14 rounded-full object-cover border-2 border-brand-200 shadow-warm" />
                  <div>
                    <h4 className="font-black text-sand-900">{selectedReq.visitorName}</h4>
                    <p className="text-xs text-sand-500 mt-0.5">{selectedReq.company}</p>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {getRiskBadge(selectedReq.aiAnalysis?.riskScore || "low")}
                      {getStatusBadge(selectedReq.status)}
                    </div>
                  </div>
                </div>

                <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 space-y-3">
                  <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">AI Analysis Summary</p>
                  <p className="text-xs text-sand-700 leading-relaxed font-mono bg-white p-3 rounded-xl border border-warm-200">
                    {selectedReq.aiAnalysis?.riskReasoning || "No AI analysis available."}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-warm-200">
                      <p className="text-sand-400 font-bold text-[10px] uppercase mb-1">Recommendation</p>
                      <p className="font-black uppercase text-brand-700">{selectedReq.aiAnalysis?.recommendation}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-warm-200">
                      <p className="text-sand-400 font-bold text-[10px] uppercase mb-1">Confidence</p>
                      <p className="font-black text-brand-700">{Math.round((selectedReq.aiAnalysis?.confidenceScore || 0.95) * 100)}%</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t border-warm-100 pt-4">
                  <label className="text-[10px] font-bold text-sand-500 uppercase block">Admin Override Note</label>
                  <textarea
                    rows={3}
                    placeholder="Reason for administrative override..."
                    value={overrideNote}
                    onChange={e => setOverrideNote(e.target.value)}
                    className="input-warm resize-none"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => handleAdminOverride(selectedReq.id, true)} disabled={overrideLoading} className="flex-1 btn-success flex items-center justify-center gap-2">
                      <CheckCircle2 size={15} /> Force Approve
                    </button>
                    <button onClick={() => handleAdminOverride(selectedReq.id, false)} disabled={overrideLoading} className="flex-1 btn-danger flex items-center justify-center gap-2">
                      <XCircle size={15} /> Force Reject
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
