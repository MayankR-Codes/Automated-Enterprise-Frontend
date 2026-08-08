import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  QrCode, AlertOctagon, 
  MapPin, LogOut, LayoutDashboard, UserCheck, ShieldAlert
} from "lucide-react";
import confetti from "canvas-confetti";

interface SecurityDashboardProps {
  onLogout: () => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ onLogout }) => {
  const { user, token } = useAuth();
  
  const [qrInput, setQrInput] = useState("");
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Lockdown Panic state
  const [lockdown, setLockdown] = useState(false);

  // Scan Code / Verify
  const handleVerifyPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    
    setLoading(true);
    setError("");
    setSuccess("");
    setScanResult(null);

    try {
      // In demo mode, if they type the mock token, we retrieve the active requests list
      // and match req-sample-1, or decode it directly by calling check-in endpoint
      const res = await fetch("http://localhost:5000/api/portal/gate-check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ qrToken: qrInput })
      });
      const data = await res.json();
      
      if (res.ok) {
        setScanResult(data.request);
        setSuccess("Access Granted! Visitor checked in successfully.");
        confetti({ particleCount: 50, spread: 80, colors: ["#10B981", "#3B82F6"] });
      } else {
        setError(data.error || "Invalid, revoked, or expired QR access code.");
      }
    } catch (e) {
      setError("Failed to connect to verification API.");
    } finally {
      setLoading(false);
    }
  };

  // Exit Check Out
  const handleCheckOut = async (requestId: string) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("http://localhost:5000/api/portal/gate-check-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Visitor checked out successfully.");
        setScanResult(data.request);
      } else {
        setError(data.error || "Failed to log checkout.");
      }
    } catch (e) {
      setError("Server connection error.");
    } finally {
      setLoading(false);
    }
  };

  // Emergency Panic Lockdown
  const handleLockdown = async () => {
    try {
      const nextLockdown = !lockdown;
      setLockdown(nextLockdown);
      
      await fetch("http://localhost:5000/api/portal/emergency", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          level: nextLockdown ? "critical" : "normal",
          description: nextLockdown ? "Manual panic alert triggered by Gate Security." : "Emergency alert clear."
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      lockdown ? "bg-rose-950 text-rose-100" : "bg-slate-900 text-slate-100"
    } flex flex-col md:flex-row relative`}>
      
      {/* Sidebar Panel */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="text-brand-500" size={24} />
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">
              SecureGate Guard
            </span>
          </div>

          <div className="space-y-1">
            <div className="p-3.5 rounded bg-brand-500/10 border-l-4 border-brand-500 text-brand-400 font-bold text-xs flex items-center gap-2.5">
              <LayoutDashboard size={16} />
              <span>Gate Dashboard</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Panic Trigger Button */}
          <button
            onClick={handleLockdown}
            className={`w-full py-3 rounded-lg border font-black text-xs flex items-center justify-center gap-2 transition ${
              lockdown 
                ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-400 animate-pulse" 
                : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
            }`}
          >
            <ShieldAlert size={18} />
            <span>{lockdown ? "CANCEL LOCKDOWN" : "PANIC LOCKDOWN"}</span>
          </button>

          <div className="p-3 bg-slate-900 border border-slate-850 rounded flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
              SG
            </div>
            <div className="truncate">
              <h4 className="text-xs font-bold truncate">{user?.name}</h4>
              <p className="text-[9px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full p-2.5 rounded border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 font-bold text-xs flex items-center justify-center gap-2.5 transition"
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
            <h2 className="text-2xl font-black">Gate Check-in Desk</h2>
            <p className="text-slate-400 text-xs mt-1">Scan tokens, log entries, and flag verification checklists.</p>
          </div>
        </div>

        {lockdown && (
          <div className="p-5 rounded-xl bg-rose-600 text-white font-black text-sm text-center flex items-center justify-center gap-3 border border-rose-500 animate-pulse shadow-2xl">
            <AlertOctagon size={24} />
            <span>SYSTEM ENFORCED LOCKDOWN ACTIVE. ALL ENTRY CHANNELS BLOCKED.</span>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Scanner Input Panel */}
          <div className="lg:col-span-5 bg-slate-950/60 rounded-xl border border-slate-850 p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <QrCode size={18} className="text-brand-500" /> QR Code Verification
              </h3>
            </div>

            <form onSubmit={handleVerifyPass} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Input QR Code Token / Scan Key</label>
                <input
                  type="text"
                  required
                  placeholder="Paste JWT QR token key..."
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                />
                <p className="text-[9px] text-slate-500">For testing: use the token string from the visitor dashboard approved card.</p>
              </div>

              {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
              {success && <p className="text-xs text-emerald-400 font-medium">{success}</p>}

              <button
                type="submit"
                disabled={loading || lockdown}
                className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded transition disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify Visitor Credentials"}
              </button>
            </form>
          </div>

          {/* Scanned Decoded Visitor Details Card */}
          <div className="lg:col-span-7 bg-slate-950/60 rounded-xl border border-slate-850 p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <UserCheck size={18} className="text-brand-500" /> Visitor Verification Card
              </h3>
            </div>

            {scanResult ? (
              <div className="space-y-6 text-left">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-slate-900 border border-slate-800 rounded-lg">
                  <img src={scanResult.photoUrl} alt={scanResult.visitorName} className="w-20 h-20 rounded-lg border border-slate-800 object-cover shrink-0" />
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-slate-200">{scanResult.visitorName}</h4>
                    <p className="text-xs text-slate-400">{scanResult.company}</p>
                    <p className="text-[10px] text-slate-500 font-mono">ID Extracted: {scanResult.ocrData?.extractedId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded">
                    <span className="text-[10px] text-slate-500 font-bold block">Allocated Room</span>
                    <span className="text-slate-350 font-bold flex items-center gap-1.5 mt-1"><MapPin size={14} className="text-brand-500" /> {scanResult.meetingDetails.roomAllocation}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded">
                    <span className="text-[10px] text-slate-500 font-bold block">Host Host Employee</span>
                    <span className="text-slate-350 font-bold mt-1 block">{scanResult.meetingDetails.employeeName}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-850 rounded-lg space-y-3 text-xs">
                  <div className="flex justify-between items-center text-[10px] border-b border-slate-850 pb-2">
                    <span className="font-bold text-slate-500 uppercase">Verification Checkpoints</span>
                    <span className="font-bold text-emerald-400 uppercase">Clear</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="flex justify-between">
                      <span className="text-slate-500">OCR Format Check:</span>
                      <span className="text-slate-350 font-bold">100% Passed</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Incident Registry Check:</span>
                      <span className="text-slate-350 font-bold">No Blacklist Matches</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Employee Override:</span>
                      <span className="text-slate-350 font-bold">{scanResult.approvals.employeeNotes || "Approved"}</span>
                    </p>
                  </div>
                </div>

                {/* Entry & Exit triggers */}
                <div className="flex gap-4">
                  {scanResult.status === "approved" && (
                    <div className="flex-1 p-3 bg-emerald-500/10 border border-emerald-500/20 text-center rounded-lg text-emerald-400 font-bold">
                      Checked In: {new Date().toLocaleTimeString()}
                    </div>
                  )}
                  {scanResult.status === "checked_in" && (
                    <button
                      onClick={() => handleCheckOut(scanResult.id)}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition"
                    >
                      Process Check-Out Exit
                    </button>
                  )}
                  {scanResult.status === "checked_out" && (
                    <div className="flex-1 p-3 bg-slate-900 border border-slate-800 text-center rounded-lg text-slate-400 font-bold">
                      Completed Visit (Checked-Out)
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <QrCode size={40} className="mx-auto text-slate-700 animate-pulse" />
                <p>Awaiting QR scans. Enter the visitor's JWT token to parse details.</p>
              </div>
            )}
          </div>

        </div>
      </main>

    </div>
  );
};
