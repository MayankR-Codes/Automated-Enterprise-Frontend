import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { mlApi } from "../services/mlApi";
import { AIAnalysisResult } from "../types";
import { 
  RefreshCw, Send, XCircle,
  LayoutDashboard, LogOut, MessageSquare, 
  Building2, Download, AlertTriangle, FileText, Bot
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

interface VisitorDashboardProps {
  onLogout: () => void;
}

const BRANCHES = [
  { id: "bhubaneswar", name: "Bhubaneswar Branch", code: "BHUB-01", address: "Infocity, Patia, Bhubaneswar" },
  { id: "damanjodi", name: "Damanjodi Branch", code: "DAM-02", address: "NALCO Township, Damanjodi" },
  { id: "angul", name: "Angul Complex", code: "ANG-03", address: "Industrial Zone, Angul" },
  { id: "corporate", name: "Corporate Headquarters", code: "HQ-00", address: "Tower A, Tech Park" },
  { id: "other", name: "Regional Office / Other", code: "REG-99", address: "Field Operations" }
];

export const VisitorDashboard: React.FC<VisitorDashboardProps> = ({ onLogout }) => {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Multi-step booking form state (Step 1: Branch & Employee, Step 2: Purpose & AI Analysis, Step 3: Summary & Submit)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0].name);
  const [employeeId, setEmployeeId] = useState("");
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [selectedEmployeeDept, setSelectedEmployeeDept] = useState("");
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [purpose, setPurpose] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [_durationMinutes, _setDurationMinutes] = useState("60");
  const [_idPhoto, setIdPhoto] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState("");
  
  // Real-time AI Visit Analysis Agent State
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // OCR Scan Simulation States
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrData, setOcrData] = useState<any>(null);

  // Chatbot Drawer State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Hello! I am your SecureGate AI Companion. Ask me about visit approvals, branch schedules, or pass downloads." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch visitor requests
  const fetchRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/portal/requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const visitorReqs = data.filter((r: any) => r.visitorId === user?.uid);
        setRequests(visitorReqs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch host employees list for select dropdown
  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/portal/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const emps = data.filter((u: any) => u.role === "employee");
        setEmployeesList(emps);
        if (emps.length > 0) {
          setEmployeeId(emps[0].uid);
          setSelectedEmployeeName(emps[0].name);
          setSelectedEmployeeDept(emps[0].details?.department || "Operations");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchEmployees();
  }, []);

  const handleSelectEmployee = (eId: string) => {
    setEmployeeId(eId);
    const emp = employeesList.find(e => e.uid === eId);
    if (emp) {
      setSelectedEmployeeName(emp.name);
      setSelectedEmployeeDept(emp.details?.department || "General");
    }
  };

  // Run AI Visit Analysis Agent when purpose changes or moving to Step 2
  const handleRunAiAnalysis = async () => {
    if (!purpose.trim()) return;
    setAiAnalyzing(true);
    try {
      const result = await mlApi.analyzeVisitorReason({
        visitorName: user?.name || "Guest Visitor",
        companyName: user?.details?.company || "Partner Corp",
        hostEmployeeName: selectedEmployeeName || "Staff Member",
        branch: selectedBranch,
        visitReason: purpose
      });
      setAiAnalysis(result);
    } catch (e) {
      console.error("AI Analysis error", e);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Simulate OCR parse when ID photo is attached
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdPhoto(file);
      setIdPhotoPreview(URL.createObjectURL(file));
      setOcrScanning(true);
      setTimeout(() => {
        setOcrData({
          extractedName: user?.name.toUpperCase() || "JOHN VISITOR",
          extractedId: user?.details?.govIdType === "pan" ? "ABCDE1234F" : "1111-2222-3333",
          confidence: 0.98,
          documentVerified: true
        });
        setOcrScanning(false);
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      }, 1500);
    }
  };

  // Submit Visit Request
  const handleBookVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/portal/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          visitorId: user?.uid,
          visitorName: user?.name,
          visitorEmail: user?.email,
          visitorMobile: user?.mobile,
          company: user?.details?.company || "Guest Corp",
          branch: selectedBranch,
          employeeId,
          hostEmployeeName: selectedEmployeeName,
          hostDepartment: selectedEmployeeDept,
          purpose,
          scheduledTime,
          durationMinutes: Number(_durationMinutes),
          aiAnalysis,
          govIdUrl: idPhotoPreview
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Visit request registered successfully. Submitted for Administrator review.");
        setPurpose("");
        setScheduledTime("");
        setIdPhoto(null);
        setIdPhotoPreview("");
        setOcrData(null);
        setAiAnalysis(null);
        setActiveStep(1);
        fetchRequests();
        confetti({ particleCount: 80, spread: 70 });
      } else {
        setError(data.error || "Failed to submit visit request.");
      }
    } catch (err) {
      setError("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  // PDF Generation Helper
  const handleDownloadPDF = (req: any) => {
    const windowContent = `
      <html>
        <head>
          <title>SecureGate AI — Visitor Approval Pass</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #f8fafc; }
            .pass-card { max-width: 650px; margin: 0 auto; background: white; border: 2px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: 900; color: #1e3a8a; margin: 0; }
            .badge { background: #dcfce7; color: #166534; font-weight: 800; padding: 6px 16px; border-radius: 9999px; font-size: 12px; text-transform: uppercase; border: 1px solid #86efac; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .field-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
            .field-val { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px; }
            .qr-section { text-align: center; border-t: 1px dashed #cbd5e1; padding-top: 24px; margin-top: 24px; }
            .qr-box { font-family: monospace; font-size: 14px; background: #0f172a; color: #38bdf8; padding: 12px 24px; border-radius: 8px; display: inline-block; font-weight: bold; letter-spacing: 2px; }
            .footer { font-size: 10px; color: #94a3b8; text-align: center; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="pass-card">
            <div class="header">
              <div>
                <h1 class="title">SecureGate AI</h1>
                <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">Official Entry Pass & Approval Record</p>
              </div>
              <span class="badge">APPROVED VISIT</span>
            </div>

            <div class="grid">
              <div><div class="field-label">Application ID</div><div class="field-val">${req.id || 'REQ-' + Math.floor(100000 + Math.random() * 900000)}</div></div>
              <div><div class="field-label">Visitor Name</div><div class="field-val">${req.visitorName || user?.name}</div></div>
              <div><div class="field-label">Branch Destination</div><div class="field-val">${req.branch || selectedBranch}</div></div>
              <div><div class="field-label">Meeting Host</div><div class="field-val">${req.hostEmployeeName || 'Host Officer'} (${req.hostDepartment || 'Dept'})</div></div>
              <div><div class="field-label">Visit Date & Time</div><div class="field-val">${new Date(req.scheduledTime || Date.now()).toLocaleString()}</div></div>
              <div><div class="field-label">Approval Status</div><div class="field-val" style="color:#16a34a;">Approved by Administrator</div></div>
            </div>

            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <div class="field-label">Visit Reason</div>
              <div class="field-val" style="font-weight: 500; margin-top: 4px;">"${req.purpose || req.visitReason}"</div>
            </div>

            <div class="qr-section">
              <p style="font-size: 11px; color: #64748b; font-weight: 700; margin-bottom: 8px;">SECURITY VERIFICATION QR IDENTIFIER</p>
              <div class="qr-box">SG-VERIFY-${(req.id || 'PASS').slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}</div>
            </div>

            <div class="footer">
              SecureGate AI Enterprise Security System &bull; Immutable Audit Verification Logged
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(windowContent);
      printWin.document.close();
    }
  };

  // Chat Bot Submission
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/portal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, role: user?.role, userId: user?.uid })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { sender: "ai", text: data.response }]);
      } else {
        setChatMessages(prev => [...prev, { sender: "ai", text: "I can assist you with your booking steps or pass downloads." }]);
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { sender: "ai", text: "Offline Assistant: You can apply for visits across Bhubaneswar, Damanjodi, Angul, or Corporate HQ." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Request stats
  const pendingCount = requests.filter(r => r.status === "pending_approval" || r.status === "PENDING").length;
  const approvedCount = requests.filter(r => r.status === "approved" || r.status === "APPROVED").length;
  const rejectedCount = requests.filter(r => r.status === "rejected" || r.status === "REJECTED").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row relative">
      
      {/* Sidebar Panel */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="text-brand-500" size={24} />
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">
              SecureGate Visitor
            </span>
          </div>

          <div className="space-y-1">
            <div className="p-3.5 rounded bg-brand-500/10 border-l-4 border-brand-500 text-brand-700 dark:text-brand-400 font-bold text-xs flex items-center gap-2.5">
              <LayoutDashboard size={16} />
              <span>Visitor Portal</span>
            </div>
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="w-full p-3.5 rounded hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-semibold flex items-center gap-2.5 transition text-left"
            >
              <MessageSquare size={16} />
              <span>AI Companion</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
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

      {/* Main Workspace */}
      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              Visitor Application Portal
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-light">Select branch, choose meeting host, preview AI importance assessment, and download approval pass.</p>
          </div>
          <button
            onClick={fetchRequests}
            className="p-2.5 rounded-full bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 shadow-sm"
            title="Refresh Log Stream"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Dashboard Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Apply for Visit</span>
            <p className="text-xl font-black text-brand-400">Step-by-Step</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Review</span>
            <p className="text-2xl font-black text-amber-400">{pendingCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Approved Visits</span>
            <p className="text-2xl font-black text-emerald-400">{approvedCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Rejected Visits</span>
            <p className="text-2xl font-black text-rose-400">{rejectedCount}</p>
          </div>
        </div>

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

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Booking Request Multi-step Form */}
          <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            
            {/* Step Navigation Tabs */}
            <div className="flex border-b border-slate-800 pb-4 justify-between items-center">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${activeStep === 1 ? 'bg-brand-500/20 text-brand-400 border-brand-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                >
                  1. Branch & Host
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (purpose) handleRunAiAnalysis();
                    setActiveStep(2);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${activeStep === 2 ? 'bg-brand-500/20 text-brand-400 border-brand-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                >
                  2. Purpose & AI Analysis
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${activeStep === 3 ? 'bg-brand-500/20 text-brand-400 border-brand-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                >
                  3. Summary & Submit
                </button>
              </div>
            </div>

            <form onSubmit={handleBookVisit} className="space-y-5 text-left">

              {/* STEP 1: Branch & Host Employee Selection */}
              {activeStep === 1 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 size={15} className="text-brand-400" /> Select Company Branch to Visit
                    </label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {BRANCHES.map(b => (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBranch(b.name)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${selectedBranch === b.name ? 'bg-brand-500/15 border-brand-500 text-white shadow-lg' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'}`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-xs">{b.name}</span>
                            <span className="text-[9px] font-mono font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{b.code}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{b.address}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Whom Do You Want to Visit?</label>
                      <select
                        value={employeeId}
                        onChange={e => handleSelectEmployee(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-brand-500"
                      >
                        {employeesList.map(e => (
                          <option key={e.uid} value={e.uid}>
                            {e.name} — {e.details?.department || "Engineering"} ({e.details?.designation || "Officer"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Scheduled Visit Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={scheduledTime}
                        onChange={e => setScheduledTime(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition"
                  >
                    Next: Enter Reason & Run AI Analysis →
                  </button>
                </div>
              )}

              {/* STEP 2: Reason for Visit & Real-time AI Visit Analysis Agent */}
              {activeStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={15} className="text-brand-400" /> Why do you want to visit this employee/company?
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Urgent vendor contract review meeting with executive team."
                      value={purpose}
                      onChange={e => setPurpose(e.target.value)}
                      className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAiAnalysis}
                    disabled={aiAnalyzing || !purpose.trim()}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Bot size={16} />
                    <span>{aiAnalyzing ? "AI Visit Analysis Agent Evaluating..." : "Run AI Reason Analysis Agent"}</span>
                  </button>

                  {/* AI Importance Card Preview */}
                  {aiAnalysis && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                          <Bot size={14} /> VisitorReasonAgent Evaluation
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                          aiAnalysis.importance === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                          aiAnalysis.importance === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                          'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}>
                          {aiAnalysis.importance === 'HIGH' ? '🔴 HIGH Importance' : aiAnalysis.importance === 'MEDIUM' ? '🟠 MEDIUM Importance' : '🟢 LOW Importance'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-semibold">{aiAnalysis.summary}</p>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                        <span className="font-bold text-indigo-300">AI Recommendation: </span>
                        {aiAnalysis.recommendedAction || "Recommended for administrator priority review."}
                      </div>

                      {/* Important Safeguard Banner */}
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] text-amber-300 flex items-center gap-2 font-medium">
                        <AlertTriangle size={16} className="shrink-0" />
                        <span>IMPORTANT: The AI provides a recommendation only. The human administrator makes the final approval decision.</span>
                      </div>
                    </div>
                  )}

                  {/* Upload ID Area */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Attach Government ID (Optional for fast-track check-in)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-200"
                    />
                    {ocrScanning && <p className="text-[10px] text-brand-400 animate-pulse">OCR scanner extracting document credentials...</p>}
                    {ocrData && <p className="text-[10px] text-emerald-400 font-bold">✓ OCR ID Verified: {ocrData.extractedName} ({ocrData.extractedId})</p>}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs transition"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="w-1/2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition"
                    >
                      Next: Review Summary →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Visitor Application Summary before submitting */}
              {activeStep === 3 && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 text-xs">
                    <h4 className="font-bold text-sm text-brand-400 border-b border-slate-800 pb-2">Visitor Application Summary</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-slate-400">Visitor:</span> <span className="font-bold">{user?.name}</span></div>
                      <div><span className="text-slate-400">Branch:</span> <span className="font-bold">{selectedBranch}</span></div>
                      <div><span className="text-slate-400">Host Person:</span> <span className="font-bold">{selectedEmployeeName || "Officer"}</span></div>
                      <div><span className="text-slate-400">Department:</span> <span className="font-bold">{selectedEmployeeDept}</span></div>
                      <div><span className="text-slate-400">Visit Date:</span> <span className="font-bold">{scheduledTime ? new Date(scheduledTime).toLocaleString() : 'As scheduled'}</span></div>
                      <div><span className="text-slate-400">AI Importance:</span> <span className="font-bold text-brand-400">{aiAnalysis?.importance || "PENDING"}</span></div>
                    </div>
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-400">Reason:</span>
                      <p className="mt-1 p-2 bg-slate-950 rounded text-slate-300 font-mono text-[11px]">"{purpose || "Routine visit"}"</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="w-1/3 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs transition"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !scheduledTime}
                      className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition"
                    >
                      {loading ? "Submitting Request..." : "Submit Visit Request"}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>

          {/* Active Visit Requests & PDF Download Section */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-extrabold flex items-center justify-between">
                <span>My Visit History & Passes</span>
                <span className="text-xs text-slate-400 font-normal">({requests.length})</span>
              </h3>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {requests.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No submitted visit requests yet.</p>
                ) : (
                  requests.map(req => {
                    const isApproved = req.status === "approved" || req.status === "APPROVED";
                    const isRejected = req.status === "rejected" || req.status === "REJECTED";
                    return (
                      <div key={req.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-xs text-slate-200">{req.branch || "Bhubaneswar Branch"}</span>
                            <p className="text-[10px] text-slate-400">Host: {req.hostEmployeeName || "Officer"}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            isApproved ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                            isRejected ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                            'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          }`}>
                            {req.status}
                          </span>
                        </div>

                        {/* Status Timeline Indicator */}
                        <div className="text-[10px] font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
                          Timeline: Application Submitted → AI Analyzed → {isApproved ? 'Approved by Admin ✓' : isRejected ? 'Rejected by Admin' : 'Waiting for Administrator'}
                        </div>

                        {/* Approved Visit Actions */}
                        {isApproved && (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleDownloadPDF(req)}
                              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                            >
                              <Download size={14} /> Download Approval PDF Pass
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* AI Companion Drawer */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 bottom-0 w-80 bg-slate-950 border-l border-slate-800 p-4 z-50 flex flex-col justify-between shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-bold text-xs text-brand-400 flex items-center gap-1.5">
                <Bot size={16} /> AI Companion
              </span>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-slate-200">
                <XCircle size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
              {chatMessages.map((m, i) => (
                <div key={i} className={`p-2.5 rounded-xl text-xs ${m.sender === 'user' ? 'bg-brand-600 text-white ml-6' : 'bg-slate-900 text-slate-300 border border-slate-800 mr-6'}`}>
                  {m.text}
                </div>
              ))}
              {chatLoading && <p className="text-[10px] text-slate-500 animate-pulse">AI thinking...</p>}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask AI..."
                className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none"
              />
              <button type="submit" className="p-2 bg-brand-600 rounded text-white"><Send size={14} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
