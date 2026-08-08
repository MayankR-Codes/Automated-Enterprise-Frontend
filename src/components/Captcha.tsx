import React, { useState, useEffect } from "react";
import { RefreshCw, TerminalSquare } from "lucide-react";
import { motion } from "framer-motion";

interface CaptchaProps {
  onChallenge: (captchaId: string, solution: string) => void;
  shouldReset?: boolean;
}

export const Captcha: React.FC<CaptchaProps> = ({ onChallenge, shouldReset }) => {
  const [captchaId, setCaptchaId] = useState("");
  const [expression, setExpression] = useState("");
  const [userVal, setUserVal] = useState("");
  const [loading, setLoading] = useState(false);

  const generateLocalCaptcha = () => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let num1 = Math.floor(Math.random() * 10) + 1;
    let num2 = Math.floor(Math.random() * 10) + 1;
    if (op === '-' && num1 < num2) {
      [num1, num2] = [num2, num1];
    }
    const expr = `${num1} ${op} ${num2}`;
    const id = `local-captcha-${Date.now()}`;
    setCaptchaId(id);
    setExpression(expr);
    setUserVal("");
    onChallenge(id, "");
  };

  const fetchCaptcha = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/captcha");
      if (res.ok) {
        const data = await res.json();
        setCaptchaId(data.captchaId);
        setExpression(data.expression);
        setUserVal("");
        onChallenge(data.captchaId, "");
        return;
      }
    } catch (e) {
      // Fallback offline generator
    } finally {
      setLoading(false);
    }
    generateLocalCaptcha();
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  useEffect(() => {
    if (shouldReset) {
      fetchCaptcha();
    }
  }, [shouldReset]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserVal(val);
    onChallenge(captchaId, val);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/50 rounded-xl relative overflow-hidden group text-left">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-500" />
      
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
        <TerminalSquare size={14} className="text-indigo-500 dark:text-indigo-400" /> Anti-Bot CAPTCHA Verification
      </label>
      
      <div className="flex gap-3 items-stretch">
        {/* Distorted math box */}
        <div 
          className="relative flex-1 select-none text-xl font-mono font-bold tracking-widest text-emerald-500 dark:text-emerald-400 bg-slate-900 dark:bg-slate-950 rounded-lg px-5 py-3 text-center border border-slate-700 dark:border-slate-800 shadow-inner flex justify-center items-center overflow-hidden"
          style={{
            backgroundImage: "linear-gradient(45deg, transparent 45%, rgba(16, 185, 129, 0.05) 45%, rgba(16, 185, 129, 0.05) 55%, transparent 55%), linear-gradient(-45deg, transparent 45%, rgba(16, 185, 129, 0.05) 45%, rgba(16, 185, 129, 0.05) 55%, transparent 55%)",
            backgroundSize: "6px 6px"
          }}
        >
          {/* Scanline effect */}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
          
          {loading ? (
            <span className="text-sm font-normal text-slate-400 dark:text-slate-600 animate-pulse font-sans">Generating...</span>
          ) : (
            <motion.span 
              key={expression}
              initial={{ filter: "blur(4px)", opacity: 0 }}
              animate={{ filter: "blur(0px)", opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="skew-x-6 scale-y-110 select-none pointer-events-none drop-shadow-[0_0_8px_rgba(52,211,153,0.3)] z-10"
            >
              {expression}
            </motion.span>
          )}
        </div>

        <button
          type="button"
          onClick={fetchCaptcha}
          disabled={loading}
          className="p-3 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all flex items-center justify-center active:scale-95"
          title="Regenerate CAPTCHA"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="relative mt-1">
        <input
          type="text"
          required
          value={userVal}
          onChange={handleChange}
          placeholder="Type exact formula (e.g. 12+6, not 18)"
          className="w-full px-4 py-3 bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700/50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-slate-100 text-sm transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-mono tracking-widest"
        />
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed pl-1">
        Security measure: Type the exact expression shown above. <span className="text-indigo-600 dark:text-indigo-400">Do not calculate the result.</span>
      </p>
    </motion.div>
  );
};
