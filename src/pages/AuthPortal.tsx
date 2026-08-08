import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Captcha } from "../components/Captcha";
import { OtpModal } from "../components/OtpModal";
import { Shield, Eye, EyeOff, Lock, Mail, User, Phone, CheckCircle, Building, Key } from "lucide-react";
import { motion } from "framer-motion";
import { apiEndpoint } from "../config/api";


interface AuthPortalProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
  initialRole?: "visitor" | "employee" | "executive" | "admin";
  initialMode?: "login" | "signup";
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ 
  onLoginSuccess, 
  onNavigateHome,
  initialRole = "employee",
  initialMode = "login"
}) => {
  const { login } = useAuth();
  
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [role, setRole] = useState<"visitor" | "employee" | "executive" | "admin">(initialRole);

  
  // Form Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Custom fields
  const [company, setCompany] = useState("");
  const [govIdType, setGovIdType] = useState("aadhaar");
  const [govIdNumber, setGovIdNumber] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [laptopDetails, setLaptopDetails] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");

  // CAPTCHA and Verification States
  const [captchaId, setCaptchaId] = useState("");
  const [captchaSolution, setCaptchaSolution] = useState("");
  const [captchaReset, setCaptchaReset] = useState(false);
  const [mfaEmail, setMfaEmail] = useState("");
  const [mfaType, setMfaType] = useState<"email" | "mobile" | "login" | "reset">("email");
  const [showOtpModal, setShowOtpModal] = useState(false);
  
  // Register Multi-Step Progress Tracker
  // Steps: 0: Form, 1: Email OTP modal, 2: Mobile OTP modal, 3: Success
  const [signupStep, setSignupStep] = useState(0);

  // Password recovery
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Quick Preset Autocomplete
  const fillPreset = (selectedRole: "visitor" | "employee" | "executive" | "admin") => {
    setRole(selectedRole);
    setIsLogin(true);
    setError("");
    setSuccess("");
    if (selectedRole === "admin") {
      setEmail("admin@securegate.ai");
      setPassword("Admin@12345");
    } else if (selectedRole === "executive") {
      setEmail("exec@securegate.ai");
      setPassword("Exec@12345");
    } else if (selectedRole === "employee") {
      setEmail("employee@securegate.ai");
      setPassword("Employee@12345");
    } else {
      setEmail("visitor@securegate.ai");
      setPassword("Visitor@12345");
    }
  };

  React.useEffect(() => {
    if (initialRole) {
      fillPreset(initialRole);
    }
  }, [initialRole]);



  // CAPTCHA Challenge Update
  const handleCaptchaChallenge = (id: string, solution: string) => {
    setCaptchaId(id);
    setCaptchaSolution(solution);
  };

  // Evaluate Password Strength
  const getPasswordStrength = () => {
    if (!password) return { label: "", color: "bg-slate-300", percent: 0 };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score === 1) return { label: "Weak", color: "bg-rose-500", percent: 25 };
    if (score === 2) return { label: "Fair", color: "bg-amber-500", percent: 50 };
    if (score === 3) return { label: "Good", color: "bg-blue-500", percent: 75 };
    return { label: "Strong", color: "bg-emerald-500", percent: 100 };
  };

  const strength = getPasswordStrength();

  // --- Submit Login Flow ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!captchaSolution) {
      setError("Please complete the CAPTCHA calculation.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiEndpoint("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, captchaId, captchaSolution }),
      });
      const data = await res.json();
      
      if (res.ok) {
        if (data.requiresMfa) {
          // Launch MFA OTP
          setMfaEmail(data.email);
          setMfaType("login");
          setShowOtpModal(true);
          setSuccess(data.message);
        } else {
          login(data.user, data.token);
          onLoginSuccess();
        }
      } else {
        setError(data.error || "Login failed. Check inputs.");
        setCaptchaReset(prev => !prev); // Refresh CAPTCHA on failure
      }
    } catch (e) {
      setError("Server connection failed. Is the API server running?");
    } finally {
      setLoading(false);
    }
  };

  // --- Submit Signup Form (Step 1) ---
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (strength.percent < 50) {
      setError("Password is too weak. Please use numbers and capitals.");
      return;
    }

    if (!captchaSolution) {
      setError("Please complete the CAPTCHA calculation.");
      return;
    }

    // Launch Step 2: Email OTP modal
    setMfaEmail(email);
    setMfaType("email");
    setShowOtpModal(true);
  };

  // Callback when OTP code is successfully verified
  const handleOtpVerified = async () => {
    setShowOtpModal(false);

    if (isLogin) {
      // Login MFA completed, verify credentials with server
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const res = await fetch(apiEndpoint("/api/auth/verify-login-mfa"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: mfaEmail, code: "MOCKED" }), // backend bypasses or checks stored
        });
        const data = await res.json();
        if (res.ok) {
          login(data.user, data.token);
          onLoginSuccess();
        } else {
          setError(data.error || "MFA validation session failed.");
        }
      } catch (e) {
        setError("MFA check failed.");
      } finally {
        setLoading(false);
      }
    } else {
      // Signup multi-step OTP tracker
      if (mfaType === "email") {
        // Email verified, now trigger Mobile OTP validation
        setMfaType("mobile");
        setShowOtpModal(true);
      } else if (mfaType === "mobile") {
        // All OTP verifications passed! Complete registration creation on server.
        setLoading(true);
        try {
          const res = await fetch(apiEndpoint("/api/auth/register"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              email: email.toLowerCase(),
              mobile,
              role,
              password,
              captchaId,
              captchaSolution,
              details: {
                company,
                govIdType,
                govIdNumber,
                vehicleNumber,
                laptopDetails,
                employeeId,
                department,
                designation,
              }
            }),
          });
          const data = await res.json();
          if (res.ok) {
            setSignupStep(3); // success view
            setSuccess("Account created successfully! You can now log in.");
          } else {
            setError(data.error || "Failed to complete account registration.");
            setCaptchaReset(prev => !prev);
          }
        } catch (e) {
          setError("Server error during registration completion.");
        } finally {
          setLoading(false);
        }
      }
    }
  };

  // --- Password Reset ---
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(apiEndpoint("/api/auth/request-password-reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Reset OTP code issued. Code: ${data.demoCode}`);
      } else {
        setError(data.error || "Recovery failed.");
      }
    } catch (e) {
      setError("Server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(apiEndpoint("/api/auth/complete-password-reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail, code: recoveryCode, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Password reset successfully. Please log in.");
        setIsForgotPassword(false);
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch (e) {
      setError("Server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-mesh-light dark:bg-mesh-dark">
      
      {/* Header Home Logo */}
      <div 
        onClick={onNavigateHome}
        className="absolute top-6 left-6 flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
      >
        <Shield size={20} className="text-brand-500" />
        <span className="font-bold text-sm tracking-tight">SecureGate AI</span>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800/60 shadow-2xl p-8 relative overflow-hidden"
      >
        {/* Premium subtle gradient background */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
        
        {/* Interactive Role Selection Gateway */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-inner">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Select Target Portal
            </span>
            <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
              Active: {role.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: "admin", label: "Admin", subtitle: "Full Ops & HITL", icon: "🛡️" },
              { id: "employee", label: "Employee", subtitle: "Copilot & Tasks", icon: "👔" },
              { id: "executive", label: "Executive", subtitle: "KPIs & Escalation", icon: "📊" },
              { id: "visitor", label: "Visitor", subtitle: "Pass & OCR Check", icon: "🎫" },
            ].map(r => {
              const isSelected = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => fillPreset(r.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? "bg-brand-600/10 dark:bg-brand-500/15 border-brand-500 text-brand-600 dark:text-brand-300 shadow-md ring-2 ring-brand-500/30"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{r.icon}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                    )}
                  </div>
                  <p className="text-xs font-black leading-tight">{r.label}</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{r.subtitle}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Auth Mode Tabs */}
        {!isForgotPassword && signupStep !== 3 && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8">
            <button
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`flex-1 pb-4 text-center text-sm font-bold border-b-2 transition ${
                isLogin ? "border-brand-500 text-brand-500" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(""); setSignupStep(0); }}
              className={`flex-1 pb-4 text-center text-sm font-bold border-b-2 transition ${
                !isLogin ? "border-brand-500 text-brand-500" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Register New
            </button>
          </div>
        )}

        {/* Main Forms */}
        {isForgotPassword ? (
          /* Forgot Password Portal */
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-extrabold">Account Security Recovery</h3>
              <p className="text-xs text-slate-400 mt-1">Request a temporary code to unlock your credentials.</p>
            </div>
            
            <form onSubmit={handleResetRequest} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-400 uppercase">Verification Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={recoveryEmail}
                  onChange={e => setRecoveryEmail(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-brand-600 text-white rounded font-bold hover:bg-brand-700 text-sm transition"
              >
                Send Recovery OTP
              </button>
            </form>

            <form onSubmit={handleResetComplete} className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-400 uppercase">OTP Reset Code</label>
                <input
                  type="text"
                  required
                  placeholder="000000"
                  value={recoveryCode}
                  onChange={e => setRecoveryCode(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-400 uppercase">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="New Secure Password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 text-sm transition"
              >
                Save New Credentials
              </button>
            </form>

            <button
              onClick={() => setIsForgotPassword(false)}
              className="text-xs text-brand-500 hover:underline block mx-auto pt-2"
            >
              Back to Login
            </button>
          </div>
        ) : signupStep === 3 ? (
          /* Signup Step Success View */
          <div className="text-center space-y-6 py-8">
            <CheckCircle className="text-emerald-500 mx-auto" size={60} />
            <div>
              <h3 className="text-2xl font-bold">Registration Successful!</h3>
              <p className="text-sm text-slate-400 mt-2">
                Your SecureGate AI account has been successfully configured and verified.
              </p>
            </div>
            <button
              onClick={() => {
                setIsLogin(true);
                setSignupStep(0);
              }}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-lg transition"
            >
              Log In Now
            </button>
          </div>
        ) : isLogin ? (
          /* Sign In Portal */
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4 border border-slate-200 dark:border-slate-800 rounded-lg p-1 mb-4">
              {(["visitor", "employee", "executive", "admin"] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-1.5 text-xs font-bold uppercase rounded transition ${
                    role === r ? "bg-slate-100 dark:bg-slate-800 text-brand-500" : "text-slate-400"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Email / User ID</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Mail size={16} /></span>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Password</label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[11px] text-brand-500 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Lock size={16} /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Captcha 
                onChallenge={handleCaptchaChallenge}
                shouldReset={captchaReset}
              />
            </div>

            {error && <p className="text-xs text-rose-500 text-left font-medium">{error}</p>}
            {success && <p className="text-xs text-emerald-500 text-left font-medium">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition"
            >
              {loading ? "Authenticating..." : "Secure Login"}
            </button>
          </form>
        ) : (
          /* Registration Portal */
          <form onSubmit={handleSignupSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4 border border-slate-200 dark:border-slate-800 rounded-lg p-1 mb-4">
              {(["visitor", "employee", "executive", "admin"] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-1.5 text-xs font-bold uppercase rounded transition ${
                    role === r ? "bg-slate-100 dark:bg-slate-800 text-brand-500" : "text-slate-400"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-left">
              {/* Common Details */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><User size={16} /></span>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Mail size={16} /></span>
                  <input
                    type="email"
                    required
                    placeholder="john@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Mobile Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Phone size={16} /></span>
                  <input
                    type="text"
                    required
                    placeholder="+91 XXXXX XXXXX"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                  />
                </div>
              </div>

              {/* Visitor Specific Fields */}
              {role === "visitor" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Company Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Building size={16} /></span>
                      <input
                        type="text"
                        required
                        placeholder="Company Corp"
                        value={company}
                        onChange={e => setCompany(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Government ID Type</label>
                    <select
                      value={govIdType}
                      onChange={e => setGovIdType(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                    >
                      <option value="aadhaar">Aadhaar Card (12-Digit)</option>
                      <option value="pan">PAN Card</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Government ID Number</label>
                    <input
                      type="text"
                      required
                      placeholder={govIdType === "aadhaar" ? "1234-5678-9012" : "ABCDE1234F"}
                      value={govIdNumber}
                      onChange={e => setGovIdNumber(e.target.value)}
                      className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Vehicle Details (Optional)</label>
                    <input
                      type="text"
                      placeholder="KA-01-XX-9999"
                      value={vehicleNumber}
                      onChange={e => setVehicleNumber(e.target.value)}
                      className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Laptop / Tech Details</label>
                    <input
                      type="text"
                      placeholder="MacBook Pro Serial XYZ"
                      value={laptopDetails}
                      onChange={e => setLaptopDetails(e.target.value)}
                      className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                    />
                  </div>
                </>
              )}

              {/* Employee/Exec/Admin specific fields */}
              {role !== "visitor" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Employee ID</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Key size={16} /></span>
                      <input
                        type="text"
                        required
                        placeholder="EMP-101"
                        value={employeeId}
                        onChange={e => setEmployeeId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Department</label>
                    <input
                      type="text"
                      required
                      placeholder="Research & Development"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                    />
                  </div>

                  {role === "employee" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Designation</label>
                      <input
                        type="text"
                        required
                        placeholder="Lead Engineer"
                        value={designation}
                        onChange={e => setDesignation(e.target.value)}
                        className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-left border-t border-slate-200 dark:border-slate-800 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                />
                {/* Strength Meter */}
                {password && (
                  <div className="mt-1.5 space-y-1">
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`${strength.color} h-full rounded-full transition-all`} style={{ width: `${strength.percent}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Strength: {strength.label}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded dark:text-slate-100 focus:outline-brand-500"
                />
              </div>
            </div>

            <Captcha 
              onChallenge={handleCaptchaChallenge}
              shouldReset={captchaReset}
            />

            {error && <p className="text-xs text-rose-500 text-left font-medium">{error}</p>}
            {success && <p className="text-xs text-emerald-500 text-left font-medium">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition"
            >
              {loading ? "Registering..." : "Send Verification OTPs"}
            </button>
          </form>
        )}

      </div>
      </motion.div>

      {/* Floating OTP verification step modal */}
      {showOtpModal && (
        <OtpModal
          email={mfaEmail}
          type={mfaType}
          onVerified={handleOtpVerified}
          onClose={() => setShowOtpModal(false)}
        />
      )}
    </div>
  );
};
