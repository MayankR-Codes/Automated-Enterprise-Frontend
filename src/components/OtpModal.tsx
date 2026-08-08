import React, { useState, useEffect } from "react";
import { X, ShieldCheck, Mail, Phone, Clock } from "lucide-react";

interface OtpModalProps {
  email: string;
  type: "email" | "mobile" | "login" | "reset";
  onVerified: () => void;
  onClose: () => void;
}

export const OtpModal: React.FC<OtpModalProps> = ({ email, type, onVerified, onClose }) => {
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const triggerOtp = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    setTimer(60);
    try {
      const res = await fetch("http://localhost:5000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type }),
      });
      const data = await res.json();
      if (res.ok) {
        setDemoCode(data.demoCode || "");
        setSuccessMsg(`A 6-digit OTP code has been broadcasted.`);
      } else {
        setError(data.error || "Failed to broadcast OTP code.");
      }
    } catch (e) {
      setError("Server connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    triggerOtp();
  }, [email, type]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter the full 6-digit OTP code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type, code }),
      });
      const data = await res.json();
      if (res.ok) {
        onVerified();
      } else {
        setError(data.error || "Verification failed. Check code.");
      }
    } catch (e) {
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 capitalize">
              {type} Verification
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info label */}
        <div className="mb-6 flex gap-3 items-start p-3.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          {type === "email" || type === "login" || type === "reset" ? (
            <Mail size={28} className="text-brand-500 shrink-0 mt-0.5" />
          ) : (
            <Phone size={28} className="text-emerald-500 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Target Destination:</span>
            <p className="font-mono text-brand-500 truncate">{email}</p>
            <p className="mt-1 text-[11px]">Enter the 6-digit confirmation key to proceed.</p>
          </div>
        </div>

        {/* Demo Mode Notice (Required) */}
        {demoCode && (
          <div className="mb-6 p-4 rounded-lg bg-brand-500/10 border border-brand-500/30 text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-brand-600 dark:text-brand-400">
              Demo OTP Notification
            </p>
            <p className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-100 mt-1 letter tracking-[0.25em]">
              {demoCode}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              (This notification represents SMS/Email dispatch in demo mode)
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full text-center py-3 text-3xl font-mono font-bold tracking-[0.2em] bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-slate-100"
            />
          </div>

          {error && <p className="text-xs text-rose-500 text-center font-medium">{error}</p>}
          {successMsg && <p className="text-xs text-emerald-500 text-center font-medium">{successMsg}</p>}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-2.5 rounded bg-brand-600 hover:bg-brand-700 text-white font-semibold transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>

          {/* Resend and Timer */}
          <div className="flex justify-between items-center text-xs mt-4">
            <div className="flex items-center gap-1 text-slate-400">
              <Clock size={14} />
              <span>Expires in {timer}s</span>
            </div>
            <button
              type="button"
              disabled={timer > 0 || loading}
              onClick={triggerOtp}
              className="text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 font-semibold disabled:text-slate-500 transition"
            >
              Resend OTP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
