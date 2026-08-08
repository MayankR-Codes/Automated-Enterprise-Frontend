import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { mlApi } from "../services/mlApi";
import { AIAnalysisResult } from "../types";
import {
  Calendar, ShieldCheck, LogOut,
  AlertTriangle, Bot, AlertOctagon, User,
  Ticket, DollarSign
} from "lucide-react";
import confetti from "canvas-confetti";
import { AiChatCopilot } from "../components/AiChatCopilot";
import { SupportTicketsManager } from "../components/SupportTicketsManager";
import { FinancialLedgerManager } from "../components/FinancialLedgerManager";
import { apiEndpoint } from "../config/api";


interface EmployeeDashboardProps {
  onLogout: () => void;
}

type Tab = "copilot" | "tickets" | "finance" | "leave" | "complaint" | "my_requests" | "host_visits";

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onLogout }) => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("copilot");

  // Leave Form State
  const [leaveType, setLeaveType] = useState<"Casual Leave" | "Sick Leave" | "Earned Leave" | "Emergency Leave" | "Other">("Sick Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveAiAnalysis, setLeaveAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [leaveAiAnalyzing, setLeaveAiAnalyzing] = useState(false);
  const [leaveList, setLeaveList] = useState<any[]>([]);

  // Complaint Form State
  const [complaintCategory, setComplaintCategory] = useState<"Infrastructure" | "IT" | "HR" | "Transport" | "Workplace" | "Security" | "Facilities" | "Other">("IT");
  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintLocation, setComplaintLocation] = useState("Bhubaneswar Office, Floor 3");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [complaintAiAnalysis, setComplaintAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [complaintAiAnalyzing, setComplaintAiAnalyzing] = useState(false);
  const [complaintsList, setComplaintsList] = useState<any[]>([]);

  // Host visits list
  const [hostVisits, setHostVisits] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchHostVisits = async () => {
    try {
      const res = await fetch(apiEndpoint("/api/portal/requests"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const myReqs = data.filter((r: any) => r.employeeId === user?.uid || r.hostEmployeeName === user?.name);
        setHostVisits(myReqs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHostVisits();
  }, []);

  // Run EmployeeRequestAgent AI Leave Analysis
  const handleAnalyzeLeave = async () => {
    if (!leaveReason.trim()) return;
    setLeaveAiAnalyzing(true);
    try {
      const start = startDate ? new Date(startDate).getTime() : Date.now();
      const end = endDate ? new Date(endDate).getTime() : Date.now();
      const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      const res = await mlApi.analyzeLeaveRequest({
        employeeId: user?.uid || "EMP-100",
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason: leaveReason
      });
      setLeaveAiAnalysis(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLeaveAiAnalyzing(false);
    }
  };

  // Submit Leave Request
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const start = startDate ? new Date(startDate).getTime() : Date.now();
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    const newLeave = {
      id: "LEAVE-" + Math.floor(100000 + Math.random() * 900000),
      employeeId: user?.uid || "EMP-100",
      employeeName: user?.name,
      department: user?.details?.department || "Engineering",
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason: leaveReason,
      aiAnalysis: leaveAiAnalysis,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    setLeaveList(prev => [newLeave, ...prev]);
    setSuccess("Leave application submitted successfully to HR Administrator.");
    setLeaveReason("");
    setStartDate("");
    setEndDate("");
    setLeaveAiAnalysis(null);
    confetti({ particleCount: 60, spread: 60 });
  };

  // Run ComplaintAnalysisAgent AI Triage
  const handleAnalyzeComplaint = async () => {
    if (!complaintDescription.trim()) return;
    setComplaintAiAnalyzing(true);
    try {
      const res = await mlApi.analyzeComplaint({
        category: complaintCategory,
        subject: complaintSubject || complaintCategory + " Issue",
        description: complaintDescription,
        location: complaintLocation
      });
      setComplaintAiAnalysis(res);
    } catch (e) {
      console.error(e);
    } finally {
      setComplaintAiAnalyzing(false);
    }
  };

  // Submit Complaint Ticket
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const newComplaint = {
      id: "TICKET-" + Math.floor(100000 + Math.random() * 900000),
      employeeId: user?.uid || "EMP-100",
      employeeName: user?.name,
      department: user?.details?.department || "Engineering",
      category: complaintCategory,
      subject: complaintSubject || complaintCategory + " Problem",
      description: complaintDescription,
      location: complaintLocation,
      priority: complaintAiAnalysis?.importance || "MEDIUM",
      aiAnalysis: complaintAiAnalysis,
      status: "SUBMITTED",
      createdAt: new Date().toISOString()
    };

    setComplaintsList(prev => [newComplaint, ...prev]);
    setSuccess("Workplace complaint ticket logged. Assigned for Admin triage.");
    setComplaintSubject("");
    setComplaintDescription("");
    setComplaintAiAnalysis(null);
    confetti({ particleCount: 70, spread: 60 });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row relative">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-brand-500" size={24} />
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">
              SecureGate Employee
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("copilot")}
              className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition text-left ${activeTab === 'copilot' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <Bot size={16} className={activeTab === 'copilot' ? "animate-pulse" : "text-indigo-400"} />
              <span>AI Support Copilot</span>
            </button>

            <button
              onClick={() => setActiveTab("tickets")}
              className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition text-left ${activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <Ticket size={16} className={activeTab === 'tickets' ? "text-white" : "text-indigo-400"} />
              <span>Support & IT Tickets</span>
            </button>

            <button
              onClick={() => setActiveTab("finance")}
              className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition text-left ${activeTab === 'finance' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <DollarSign size={16} className={activeTab === 'finance' ? "text-white" : "text-emerald-400"} />
              <span>Business Expenses & Sales</span>
            </button>

            <div className="pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-3">
              Standard Requests
            </div>

            <button
              onClick={() => setActiveTab("leave")}
              className={`w-full p-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 transition text-left ${activeTab === 'leave' ? 'bg-brand-500/10 border-l-4 border-brand-500 text-brand-700 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <Calendar size={15} />
              <span>Apply for Holiday / Leave</span>
            </button>

            <button
              onClick={() => setActiveTab("complaint")}
              className={`w-full p-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 transition text-left ${activeTab === 'complaint' ? 'bg-brand-500/10 border-l-4 border-brand-500 text-brand-700 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <AlertOctagon size={15} />
              <span>Workplace Complaints</span>
            </button>

            <button
              onClick={() => setActiveTab("host_visits")}
              className={`w-full p-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 transition text-left ${activeTab === 'host_visits' ? 'bg-brand-500/10 border-l-4 border-brand-500 text-brand-700 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <User size={15} />
              <span>Visitor Appointments</span>
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-6">
          <div className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs">
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

      {/* Main Content Area */}
      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              Employee Portal — {user?.name}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-light">Autonomous HR & IT Support, Incident Triage, Financial Ledger, and Leave Management.</p>
          </div>
        </div>

        {/* TAB: AI Copilot */}
        {activeTab === "copilot" && (
          <AiChatCopilot />
        )}

        {/* TAB: Support & IT Tickets */}
        {activeTab === "tickets" && (
          <SupportTicketsManager />
        )}

        {/* TAB: Finance & Expense Ledger */}
        {activeTab === "finance" && (
          <FinancialLedgerManager />
        )}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold">
            {success}
          </div>
        )}

        {/* WORKFLOW 1: Apply for Leave / Holiday */}
        {activeTab === "leave" && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-5 text-left">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black text-brand-400 flex items-center gap-2">
                  <Calendar size={20} /> Apply for Holiday / Leave
                </h3>
                <p className="text-xs text-slate-400 mt-1">Submit request details to trigger real-time AI leave priority assessment.</p>
              </div>

              <form onSubmit={handleSubmitLeave} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Leave Category</label>
                    <select
                      value={leaveType}
                      onChange={e => setLeaveType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-brand-500"
                    >
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Earned Leave">Earned Leave</option>
                      <option value="Emergency Leave">Emergency Leave</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
                    <input
                      type="text"
                      readOnly
                      value={user?.details?.department || "Engineering"}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Leave Reason & Details</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide details (e.g. High fever, doctor advised 3 days bed rest)."
                    value={leaveReason}
                    onChange={e => setLeaveReason(e.target.value)}
                    className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAnalyzeLeave}
                  disabled={leaveAiAnalyzing || !leaveReason.trim()}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Bot size={16} />
                  <span>{leaveAiAnalyzing ? "EmployeeRequestAgent Evaluating..." : "Analyze Leave Reason with AI Agent"}</span>
                </button>

                {/* AI Leave Importance Preview */}
                {leaveAiAnalysis && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                        <Bot size={14} /> EmployeeRequestAgent Evaluation
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                        leaveAiAnalysis.importance === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                        leaveAiAnalysis.importance === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}>
                        {leaveAiAnalysis.importance === 'HIGH' ? '🔴 HIGH Priority' : leaveAiAnalysis.importance === 'MEDIUM' ? '🟠 MEDIUM Priority' : '🟢 LOW Priority'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-semibold">{leaveAiAnalysis.summary}</p>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                      <span className="font-bold text-indigo-300">AI Recommendation: </span>
                      {leaveAiAnalysis.recommendedAction || "Routine HR review recommended."}
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] text-amber-300 flex items-center gap-2 font-medium">
                      <AlertTriangle size={16} className="shrink-0" />
                      <span>IMPORTANT: AI evaluates request priority only. The administrator makes the final leave approval decision.</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!startDate || !endDate || !leaveReason}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition"
                >
                  Submit Leave Application
                </button>
              </form>
            </div>

            <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-4 text-left">
              <h3 className="text-sm font-extrabold text-slate-200">Recent Leave Applications</h3>
              <div className="space-y-3">
                {leaveList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No leave applications submitted yet.</p>
                ) : (
                  leaveList.map(item => (
                    <div key={item.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span>{item.leaveType} ({item.totalDays} Days)</span>
                        <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[10px]">{item.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Dates: {item.startDate} to {item.endDate}</p>
                      <p className="text-[11px] text-slate-300 italic">"{item.reason}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* WORKFLOW 2: Raise Workplace Complaint */}
        {activeTab === "complaint" && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-5 text-left">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                  <AlertOctagon size={20} /> Raise Workplace Complaint
                </h3>
                <p className="text-xs text-slate-400 mt-1">Report infrastructure, IT, or facility inconvenience to trigger AI triage analysis.</p>
              </div>

              <form onSubmit={handleSubmitComplaint} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Complaint Category</label>
                    <select
                      value={complaintCategory}
                      onChange={e => setComplaintCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-brand-500"
                    >
                      <option value="IT">IT & Hardware</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Facilities">Facilities & Amenities</option>
                      <option value="HR">HR & Management</option>
                      <option value="Transport">Transport</option>
                      <option value="Workplace">Workplace Environment</option>
                      <option value="Security">Security</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Location / Area</label>
                    <input
                      type="text"
                      required
                      value={complaintLocation}
                      onChange={e => setComplaintLocation(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Primary Server Room AC Cooling Failure"
                    value={complaintSubject}
                    onChange={e => setComplaintSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Complaint Description & Impact</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the issue (e.g. Temperature rising rapidly in server rack 4)."
                    value={complaintDescription}
                    onChange={e => setComplaintDescription(e.target.value)}
                    className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAnalyzeComplaint}
                  disabled={complaintAiAnalyzing || !complaintDescription.trim()}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Bot size={16} />
                  <span>{complaintAiAnalyzing ? "ComplaintAnalysisAgent Evaluating..." : "Run AI Complaint Triage Agent"}</span>
                </button>

                {/* AI Complaint Triage Preview */}
                {complaintAiAnalysis && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                        <Bot size={14} /> ComplaintAnalysisAgent Risk Evaluation
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                        complaintAiAnalysis.importance === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                        complaintAiAnalysis.importance === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                        complaintAiAnalysis.importance === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}>
                        {complaintAiAnalysis.importance} RISK LEVEL
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-semibold">{complaintAiAnalysis.summary}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div><span className="text-slate-400">Suggested Dept:</span> <span className="font-bold text-indigo-300">{complaintAiAnalysis.suggestedDepartment}</span></div>
                      <div><span className="text-slate-400">Suggested Action:</span> <span className="font-bold text-indigo-300">{complaintAiAnalysis.suggestedAction}</span></div>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] text-amber-300 flex items-center gap-2 font-medium">
                      <AlertTriangle size={16} className="shrink-0" />
                      <span>IMPORTANT: AI triages and suggests routing. AI must never close the complaint automatically.</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!complaintSubject || !complaintDescription}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition"
                >
                  Submit Complaint Ticket
                </button>
              </form>
            </div>

            <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-4 text-left">
              <h3 className="text-sm font-extrabold text-slate-200">Complaint Tickets History</h3>
              <div className="space-y-3">
                {complaintsList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No workplace complaints logged yet.</p>
                ) : (
                  complaintsList.map(item => (
                    <div key={item.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span>{item.subject}</span>
                        <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-[10px]">{item.priority}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Category: {item.category} | Location: {item.location}</p>
                      <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded font-mono">
                        Timeline: Submitted → AI Analyzed → Admin Reviewing → Solved OR Forwarded → Resolved
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: My Requests & Tickets */}
        {activeTab === "my_requests" && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-4 text-left">
            <h3 className="text-base font-extrabold">All Active Submissions & Complaint Tickets</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-xs text-brand-400">Submitted Leaves ({leaveList.length})</h4>
                {leaveList.map(l => (
                  <div key={l.id} className="p-3 bg-slate-950 rounded border border-slate-850 text-xs">
                    <div className="flex justify-between font-bold"><span>{l.leaveType}</span><span className="text-amber-400">{l.status}</span></div>
                    <p className="text-[11px] text-slate-400 mt-1">{l.reason}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-xs text-amber-400">Workplace Complaints ({complaintsList.length})</h4>
                {complaintsList.map(c => (
                  <div key={c.id} className="p-3 bg-slate-950 rounded border border-slate-850 text-xs">
                    <div className="flex justify-between font-bold"><span>{c.subject}</span><span className="text-rose-400">{c.status}</span></div>
                    <p className="text-[11px] text-slate-400 mt-1">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Host Visit Requests */}
        {activeTab === "host_visits" && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-4 text-left">
            <h3 className="text-base font-extrabold">Visits Scheduled for Me</h3>
            <div className="space-y-3">
              {hostVisits.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No visitor appointments assigned to you.</p>
              ) : (
                hostVisits.map(v => (
                  <div key={v.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs text-slate-200">{v.visitorName} ({v.company || "Guest"})</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Purpose: "{v.purpose || v.visitReason}"</p>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs font-bold text-brand-400">{v.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
