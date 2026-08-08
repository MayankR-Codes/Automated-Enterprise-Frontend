import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Bot, Calendar, Bell, FileText, CheckCircle2, ChevronDown, 
  Eye, Lock, Cpu, Star, Mail, 
  Phone, Globe, Moon, Sun, AlertTriangle
} from "lucide-react";

interface LandingPageProps {
  onNavigate: (page: string, role?: "visitor" | "employee" | "executive" | "admin") => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, theme, onToggleTheme }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const features = [
    { icon: <Bot size={24} className="text-blue-500" />, title: "Document Verification Agent", desc: "Automated OCR extraction, format validation, and verification of Aadhaar/PAN documents." },
    { icon: <Shield size={24} className="text-rose-500" />, title: "Risk Analysis Agent", desc: "Scans Curated blacklists, analyzes arrival times, and flags potential security threats." },
    { icon: <Cpu size={24} className="text-purple-500" />, title: "Approval Recommendation Agent", desc: "Recommends Approve, Reject, or Escalate actions based on risk rating." },
    { icon: <Calendar size={24} className="text-emerald-500" />, title: "Scheduling Agent", desc: "Detects calendar booking conflicts and allocates meeting rooms automatically." },
    { icon: <Bell size={24} className="text-amber-500" />, title: "Notification Agent", desc: "Dispatches instant Email, SMS, WhatsApp, and Push updates across all roles." },
    { icon: <FileText size={24} className="text-indigo-500" />, title: "Audit Agent", desc: "Logs all logins, logouts, AI recommendations, and security scans on an immutable database." }
  ];

  const workflowSteps = [
    { title: "Visitor Registers", desc: "Visitor fills form and uploads government ID." },
    { title: "AI OCR Parsing", desc: "OCR extracts name and ID details instantly." },
    { title: "Risk Assessment", desc: "Safety metrics analyze visitor profiles against security lists." },
    { title: "Employee Approval", desc: "Host employee validates request details with one click." },
    { title: "QR Pass Issued", desc: "Secure encrypted QR Code with expiry is emailed to visitor." },
    { title: "Security Gate Scan", desc: "Security guards scan the QR pass to log entry and check-in." }
  ];

  const faqs = [
    { q: "How do the AI Agents verify government documents?", a: "The system utilizes the Document Verification Agent powered by OCR. It extracts text, validates format configurations (such as Aadhaar or PAN formatting), checks for system-wide duplicate IDs, and flags inconsistencies." },
    { q: "What happens if a visitor is categorized as High Risk?", a: "If the Risk Analysis Agent flags a visitor as High Risk, the Approval Recommendation Agent automatically escalates the workflow, bypassing the standard Employee channel and routing it directly to Senior Executives and Administrators." },
    { q: "Can this system run offline?", a: "Yes. SecureGate AI features a dual mode. It runs locally in offline fallback mode using local databases and simulated agents, or integrates with cloud services like Firebase and Gemini API." },
    { q: "Does the system support emergency overrides?", a: "Absolutely. Security guards and administrators have panic buttons to trigger lockdowns and block entry, logging the incident instantly." }
  ];

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} font-sans`}>
      
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-slate-200/20 dark:border-slate-800/40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("home")}>
            <div className="p-2 rounded-lg bg-brand-600 text-white shadow-lg animate-pulse-ring">
              <Shield size={22} />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">
              SecureGate AI
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#about" className="hover:text-brand-500 transition">About</a>
            <a href="#features" className="hover:text-brand-500 transition">Features</a>
            <a href="#workflow" className="hover:text-brand-500 transition">Workflow</a>
            <a href="#preview" className="hover:text-brand-500 transition">Dashboard</a>
            <a href="#faq" className="hover:text-brand-500 transition">FAQ</a>
            <a href="#contact" className="hover:text-brand-500 transition">Contact</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onToggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition text-slate-500"
            >
              {theme === "dark" ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-indigo-500" />}
            </button>
            <button 
              onClick={() => onNavigate("login", "admin")}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 px-3 py-1.5 rounded-lg border border-brand-500/20 transition"
            >
              Admin Sign In
            </button>
            <button 
              onClick={() => onNavigate("login", "employee")}
              className="text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-1.5 rounded-lg transition shadow-md shadow-brand-500/10"
            >
              Employee Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-600 dark:text-brand-400 text-xs font-semibold">
              <Bot size={14} />
              <span>Multi-Agent AI Enterprise & Security Pipeline</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
              Enterprise-Grade AI <br />
              <span className="bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">
                Workflow Automation
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Autonomous AI agent pipeline for automated employee copilot, IT support triage, HITL approvals, finance ledger, and visitor verification.
            </p>

            {/* Direct Role Authentication Buttons */}
            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Authenticate into your portal:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
                <button
                  onClick={() => onNavigate("login", "admin")}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-lg transition text-left group"
                >
                  <span className="text-lg">🛡️</span>
                  <p className="text-xs font-black text-slate-900 dark:text-white mt-1 group-hover:text-brand-500">Admin Portal</p>
                  <p className="text-[10px] text-slate-400">HITL & Operations</p>
                </button>

                <button
                  onClick={() => onNavigate("login", "employee")}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-lg transition text-left group"
                >
                  <span className="text-lg">👔</span>
                  <p className="text-xs font-black text-slate-900 dark:text-white mt-1 group-hover:text-brand-500">Employee Portal</p>
                  <p className="text-[10px] text-slate-400">Copilot & Ledger</p>
                </button>

                <button
                  onClick={() => onNavigate("login", "executive")}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-lg transition text-left group"
                >
                  <span className="text-lg">📊</span>
                  <p className="text-xs font-black text-slate-900 dark:text-white mt-1 group-hover:text-brand-500">Executive</p>
                  <p className="text-[10px] text-slate-400">KPIs & Escalations</p>
                </button>

                <button
                  onClick={() => onNavigate("login", "visitor")}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-lg transition text-left group"
                >
                  <span className="text-lg">🎫</span>
                  <p className="text-xs font-black text-slate-900 dark:text-white mt-1 group-hover:text-brand-500">Visitor Pass</p>
                  <p className="text-[10px] text-slate-400">Check-in & QR</p>
                </button>
              </div>
            </div>
          </div>


          <div className="lg:col-span-5 flex justify-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-md glass-card rounded-2xl p-6 border border-slate-200/20 relative shadow-2xl animate-float"
            >
              {/* Dashboard Preview mockup */}
              <div className="flex justify-between items-center border-b border-slate-200/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-xs text-slate-400 font-mono">gate_verification_stream</span>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-slate-500/5 rounded-lg border border-slate-200/10 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-800 flex items-center justify-center font-bold">JD</div>
                    <div>
                      <h4 className="text-xs font-bold">John Doe</h4>
                      <p className="text-[10px] text-slate-400">Aadhaar: XXXX-XXXX-4004</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30 px-2 py-0.5 rounded">Verified</span>
                </div>

                <div className="p-3 bg-slate-500/5 rounded-lg border border-slate-200/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Bot size={14} className="text-indigo-400" /> Risk Score
                    </span>
                    <span className="font-bold text-emerald-400 uppercase">Low (12%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: "12%" }} />
                  </div>
                </div>

                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg space-y-1">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">AI Recommendation</p>
                  <p className="text-xs text-slate-300 font-medium">Recommending instant check-in. Room Allocated: Conf Room B. Timeline cleared.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About SecureGate AI */}
      <section id="about" className="py-20 px-6 border-y border-slate-200/20 dark:border-slate-900/40 relative">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold">About SecureGate AI</h2>
          <p className="text-slate-400 max-w-3xl mx-auto leading-relaxed text-sm sm:text-base">
            SecureGate AI redefines physical security check-ins by replacing slow, unsafe processes with coordinated AI agents. The platform automates credential validation, scans registries, dispatches alerts, and updates security guards, all while guaranteeing humans remain in control of the approval system.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-slate-500/5">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Autonomous AI Agent Teams</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Our 6 distinct specialized agents manage security workflows without human delay.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div 
                key={i} 
                className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 transition shadow-sm hover:shadow-lg flex flex-col gap-4 text-left group"
              >
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit group-hover:scale-110 transition">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Workflow Section */}
      <section id="workflow" className="py-20 px-6 border-b border-slate-200/20 dark:border-slate-900/40">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold">The Audit Workflow</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Inspect how visitor requests flow transparently from sign-up to check-out.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-6 relative">
            {workflowSteps.map((w, i) => (
              <div key={i} className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative space-y-3 text-left shadow-sm">
                <span className="text-3xl font-extrabold text-brand-500/20 font-mono">0{i+1}</span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{w.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="preview" className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              A Unified Control Center <br />
              For Host Employees
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Our Employee portal provides immediate access to live schedules, visitor profiles, and recommendations. Review extracted credentials, safety logs, and meeting timelines at a glance.
            </p>
            <div className="space-y-3">
              <div className="flex gap-2.5 items-start">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <span className="text-sm">Approve, reject, or request more information in one click.</span>
              </div>
              <div className="flex gap-2.5 items-start">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <span className="text-sm">Integrate with Outlook, Google Calendar, and Microsoft Teams.</span>
              </div>
              <div className="flex gap-2.5 items-start">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <span className="text-sm">Verify vehicle registrations and tech inventories.</span>
              </div>
            </div>
            <button 
              onClick={() => onNavigate("login")}
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-500/10 text-sm"
            >
              Inspect Dashboard
            </button>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-200/20 shadow-2xl relative">
            {/* Visual Dashboard mockup */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm">Visitor Log Stream</h3>
              <span className="text-[10px] uppercase font-bold text-brand-500 bg-brand-500/10 px-2 py-0.5 border border-brand-500/30 rounded">Live</span>
            </div>
            <div className="space-y-3 text-left">
              {[
                { name: "John Visitor", company: "Partner Corp", time: "10:30 AM", status: "Approved" },
                { name: "Alice Spammer", company: "Blacklisted Corp", time: "11:15 AM", status: "Rejected", risk: true },
                { name: "Bob Guest", company: "Freelance", time: "01:00 PM", status: "Pending" }
              ].map((v, i) => (
                <div key={i} className="p-3.5 bg-slate-500/5 rounded-lg border border-slate-200/10 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold flex items-center gap-1.5">
                      {v.name}
                      {v.risk && <AlertTriangle size={14} className="text-rose-500 animate-bounce" />}
                    </h4>
                    <p className="text-[10px] text-slate-400">{v.company} • Purpose: Collaboration</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block mb-1">{v.time}</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                      v.status === "Approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                      v.status === "Rejected" ? "bg-rose-500/10 text-rose-400 border-rose-500/30" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}>
                      {v.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Analytics Preview */}
      <section className="py-20 px-6 bg-slate-500/5">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Executive Platform Analytics</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Real-time graphs plotting visitor peaks, approvals ratio, and department metrics.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Peak Entry Distribution</h4>
              <div className="flex items-end gap-3 h-28 pt-4">
                {[40, 65, 80, 50, 90, 75, 45].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full bg-brand-500/80 rounded-t-sm transition hover:bg-brand-400 cursor-pointer" style={{ height: `${val}%` }} />
                    <span className="text-[9px] text-slate-400 font-mono">0{i+9}h</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Risk Assessment Ratios</h4>
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Low Risk Requests</span>
                    <span className="text-emerald-400">82%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: "82%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Medium Risk Escalations</span>
                    <span className="text-amber-400">14%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: "14%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Banned/Blocked Blacklist</span>
                    <span className="text-rose-400">4%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className="bg-rose-400 h-full rounded-full" style={{ width: "4%" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">General Highlights</h4>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-slate-500/5 rounded-lg border border-slate-200/10">
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Visited</span>
                  <span className="text-xl font-bold font-mono">1,402</span>
                </div>
                <div className="p-3 bg-slate-500/5 rounded-lg border border-slate-200/10">
                  <span className="text-[10px] text-slate-400 block font-semibold">Approval Rate</span>
                  <span className="text-xl font-bold font-mono">94.2%</span>
                </div>
                <div className="p-3 bg-slate-500/5 rounded-lg border border-slate-200/10">
                  <span className="text-[10px] text-slate-400 block font-semibold">Avg Process Time</span>
                  <span className="text-xl font-bold font-mono">4.2 min</span>
                </div>
                <div className="p-3 bg-slate-500/5 rounded-lg border border-slate-200/10">
                  <span className="text-[10px] text-slate-400 block font-semibold">Blacklisted Escapes</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose SecureGate AI */}
      <section className="py-20 px-6 border-b border-slate-200/20 dark:border-slate-900/40">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Why Choose SecureGate AI?</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Our unique features address critical gaps in traditional legacy registration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              { icon: <Lock size={20} className="text-blue-500" />, title: "MFA Authentication", desc: "Dual verification channels (Email + Mobile OTP) block unauthenticated profile edits." },
              { icon: <Eye size={20} className="text-indigo-500" />, title: "AI Explainability", desc: "No decision happens in secret. Review confidence scores and matching reasons." },
              { icon: <FileText size={20} className="text-purple-500" />, title: "Immutable Audit Trails", desc: "Audit logs document logins, signouts, scanner details, and overrides." },
              { icon: <Cpu size={20} className="text-emerald-500" />, title: "Local Fallback Engine", desc: "Fully operational offline mode ensures business continuity if internet drops." }
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">{item.icon}</div>
                <h4 className="font-bold text-sm">{item.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Trusted By Security Directors</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Read how SecureGate AI transformed visitor workflows in enterprise sectors.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { text: "SecureGate AI reduced check-in queues by 80% while keeping our audits perfectly clean. The AI agent workflow is transparent.", author: "Marcus Vance", role: "VP of Physical Security at TechCorp", stars: 5 },
              { text: "The local fallback database saved us during a cloud outage. Our entry guards remained fully capable of scanning QR codes.", author: "Elena Rostova", role: "Head of Infrastructure, Global Labs", stars: 5 },
              { text: "We love the explainable AI recommendation. It provides context on why it escorts or escalates visitor approvals.", author: "David K.", role: "Lead Operations Manager", stars: 5 }
            ].map((t, i) => (
              <div key={i} className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex gap-1 text-amber-500">
                    {[...Array(t.stars)].map((_, idx) => <Star key={idx} size={14} fill="currentColor" />)}
                  </div>
                  <p className="text-xs italic text-slate-500 dark:text-slate-400 leading-relaxed">"{t.text}"</p>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{t.author}</h4>
                  <p className="text-[10px] text-slate-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 border-t border-slate-200/20 dark:border-slate-900/40">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm">Have queries about setup or compliance? Check out our quick guide.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-left">
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex justify-between items-center text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`text-slate-400 transition-transform ${activeFaq === i ? "rotate-180" : ""}`} size={18} />
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200/10 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 bg-slate-500/5">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Connect With Our Team</h2>
            <p className="text-slate-400 text-sm">Need corporate customizations or high-volume gate support?</p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-stretch">
            <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between gap-6 text-left">
              <div>
                <h4 className="font-bold text-base mb-2">Corporate HQ</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  SecureGate AI Inc.<br />
                  100 Security Boulevard, Suite 500<br />
                  Silicon Valley, CA 94025
                </p>
              </div>
              <div className="space-y-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-brand-500" />
                  <span>support@securegate.ai</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-brand-500" />
                  <span>+1 (800) 555-GATE</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-brand-500" />
                  <span>www.securegate.ai</span>
                </div>
              </div>
            </div>

            <form onSubmit={e => e.preventDefault()} className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 text-left">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">First Name</label>
                  <input type="text" placeholder="John" className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Email Address</label>
                  <input type="email" placeholder="john@company.com" className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Message Content</label>
                <textarea rows={3} placeholder="Tell us about your requirements..." className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500" />
              </div>
              <button 
                type="submit" 
                className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded transition"
              >
                Send Request
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="border-t border-slate-200/20 dark:border-slate-800/40 py-12 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-left mb-8">
          <div className="space-y-3">
            <h4 className="font-bold text-sm">SecureGate AI</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enterprise Business Process Automation and secure visitor check-in pipeline powered by autonomous AI agent teams.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Product</h5>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#features" className="hover:text-brand-500 transition">Agent Orchestrator</a></li>
              <li><a href="#workflow" className="hover:text-brand-500 transition">Verification Workflow</a></li>
              <li><a href="#preview" className="hover:text-brand-500 transition">Executive Dashboard</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Safety & Compliance</h5>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#faq" className="hover:text-brand-500 transition">Privacy Constitution</a></li>
              <li><a href="#faq" className="hover:text-brand-500 transition">GDPR Compliance</a></li>
              <li><a href="#faq" className="hover:text-brand-500 transition">Audit Traceability</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Developer</h5>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#faq" className="hover:text-brand-500 transition">API Documentation</a></li>
              <li><a href="#faq" className="hover:text-brand-500 transition">Integrations</a></li>
              <li><a href="#faq" className="hover:text-brand-500 transition">GitHub Repo</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200/10 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 gap-4">
          <span>© 2026 SecureGate AI Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#faq" className="hover:text-brand-500 transition">Privacy Policy</a>
            <a href="#faq" className="hover:text-brand-500 transition">Terms of Service</a>
            <a href="#faq" className="hover:text-brand-500 transition">Cookie Settings</a>
          </div>
        </div>
      </footer>

    </div>
  );
};
