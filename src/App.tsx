import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LandingPage } from "./pages/LandingPage";
import { AuthPortal } from "./pages/AuthPortal";
import { VisitorDashboard } from "./pages/VisitorDashboard";
import { EmployeeDashboard } from "./pages/EmployeeDashboard";
import { ExecutiveDashboard } from "./pages/ExecutiveDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { SecurityDashboard } from "./pages/SecurityDashboard";
import { Bell, ShieldCheck, Sun, Moon, LogOut } from "lucide-react";

const MainApp: React.FC = () => {
  const { user, logout, notifications, clearNotifications } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [authRole, setAuthRole] = useState<"visitor" | "employee" | "executive" | "admin">("employee");

  // Persistent Dark / Night Mode state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "dark";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  // Inactivity Session Timeout (15 minutes)
  const TIMEOUT_MS = 15 * 60 * 1000;
  useEffect(() => {
    if (!user) return;
    let timeoutId: any;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert("Session expired due to inactivity. Logging out.");
        logout();
        setCurrentPage("login");
      }, TIMEOUT_MS);
    };
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keypress", resetTimer);
    window.addEventListener("click", resetTimer);
    resetTimer();
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keypress", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [user]);

  // Navigate to Dashboard when logged in, or Login when logged out
  useEffect(() => {
    if (user) {
      setCurrentPage("dashboard");
    } else if (currentPage === "dashboard") {
      setCurrentPage("login");
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    setCurrentPage("login");
  };

  const getChannelStyle = (channel: string) => {
    switch (channel) {
      case "sms": return "text-sage-700 bg-sage-50 border-sage-200";
      case "whatsapp": return "text-sage-700 bg-sage-50 border-sage-200";
      case "push": return "text-amber-700 bg-amber-50 border-amber-200";
      default: return "text-brand-700 bg-brand-50 border-brand-200";
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-slate-950 font-sans text-sand-900 dark:text-slate-100 transition-colors duration-200">

      {/* ─── Home / Landing Page ─── */}
      {currentPage === "home" && (
        <LandingPage
          onNavigate={(page, role) => {
            if (role) setAuthRole(role);
            setCurrentPage(page);
          }}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* ─── Auth Portal ─── */}
      {(currentPage === "login" || currentPage === "signup" || (!user && currentPage === "dashboard")) && (
        <AuthPortal
          initialRole={authRole}
          initialMode={currentPage === "signup" ? "signup" : "login"}
          onLoginSuccess={() => setCurrentPage("dashboard")}
          onNavigateHome={() => setCurrentPage("home")}
        />
      )}

      {/* ─── Authenticated Dashboard ─── */}
      {currentPage === "dashboard" && user && (
        <>
          {/* Top Header Bar */}
          <header className="bg-white dark:bg-slate-900 border-b border-warm-200 dark:border-slate-800 px-6 py-3.5 flex justify-between items-center shadow-warm-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brown-gradient flex items-center justify-center shadow-warm-sm">
                <ShieldCheck size={16} className="text-white" />
              </div>
              <div>
                <span className="font-black text-sm text-brand-800 dark:text-brand-400 tracking-tight">SecureGate AI</span>
                <span className="text-[10px] text-sand-400 dark:text-slate-400 font-semibold ml-2 uppercase tracking-widest hidden sm:inline">
                  {user.role} portal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Mode Switcher */}
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 text-xs font-bold"
                title={`Switch to ${theme === "dark" ? "Light Mode (Day)" : "Dark Mode (Night)"}`}
              >
                {theme === "dark" ? (
                  <>
                    <Sun size={15} className="text-amber-400" />
                    <span className="hidden sm:inline text-amber-300">Day Mode</span>
                  </>
                ) : (
                  <>
                    <Moon size={15} className="text-indigo-600" />
                    <span className="hidden sm:inline text-indigo-700">Night Mode</span>
                  </>
                )}
              </button>

              {/* Notification bell */}
              {notifications.length > 0 && (
                <div className="relative">
                  <div className="p-2 bg-warm-50 dark:bg-slate-800 border border-warm-200 dark:border-slate-700 rounded-xl relative">
                    <Bell size={16} className="text-brand-600 dark:text-brand-400" />
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rust-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  </div>
                </div>
              )}

              {/* Security Gate Button for admin */}
              {user.role === "admin" && (
                <button
                  onClick={() => setCurrentPage("security_gate")}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  Security Gate
                </button>
              )}

              {/* User pill */}
              <div className="flex items-center gap-2.5 pl-3 border-l border-warm-200 dark:border-slate-800">
                <div className="w-7 h-7 rounded-full bg-brown-gradient flex items-center justify-center text-white font-black text-[10px] shadow-warm-sm">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-sand-800 dark:text-slate-200 leading-none">{user.name}</p>
                  <p className="text-[10px] text-sand-400 dark:text-slate-400 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out & Switch Role"
                  className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </header>

          {/* Role-based Dashboard */}
          {user.role === "visitor"   && <VisitorDashboard   onLogout={handleLogout} />}
          {user.role === "employee"  && <EmployeeDashboard  onLogout={handleLogout} />}
          {user.role === "executive" && <ExecutiveDashboard onLogout={handleLogout} />}
          {user.role === "admin"     && <AdminDashboard     onLogout={handleLogout} />}
        </>
      )}

      {/* ─── Security Gate Portal ─── */}
      {currentPage === "security_gate" && (
        <>
          <header className="bg-white dark:bg-slate-900 border-b border-warm-200 dark:border-slate-800 px-6 py-3.5 flex justify-between items-center shadow-warm-sm sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-brand-600 dark:text-brand-400" />
              <span className="font-black text-sm text-brand-800 dark:text-brand-300">Security Access Gate</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 text-xs font-bold"
              >
                {theme === "dark" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
              </button>
              <button
                onClick={() => setCurrentPage("dashboard")}
                className="btn-secondary text-xs py-2 px-3"
              >
                ← Back to Dashboard
              </button>
            </div>
          </header>
          <SecurityDashboard onLogout={handleLogout} />
        </>
      )}

      {/* ─── Demo Notification Toast Stream ─── */}
      <div className="fixed bottom-6 left-6 z-50 w-full max-w-sm space-y-2.5 pointer-events-none">
        {notifications.slice(0, 3).map((noti) => (
          <div
            key={noti.id}
            className="pointer-events-auto p-4 rounded-2xl bg-white border border-warm-200 shadow-warm-lg flex gap-3 slide-in-left"
          >
            <div className="p-2 bg-brand-50 border border-brand-100 rounded-xl text-brand-600 h-fit shrink-0">
              <Bell size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2 mb-1">
                <span className="font-bold text-sand-900 text-xs">{noti.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize shrink-0 ${getChannelStyle(noti.channel)}`}>
                  {noti.channel}
                </span>
              </div>
              <p className="text-[11px] text-sand-500 leading-relaxed">{noti.message}</p>
              <p className="text-[9px] text-sand-400 font-mono mt-1">{new Date(noti.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        {notifications.length > 0 && (
          <button
            onClick={clearNotifications}
            className="pointer-events-auto text-[10px] font-bold text-sand-500 hover:text-brand-600 bg-white border border-warm-200 rounded-full px-4 py-1.5 block mx-auto shadow-warm-sm transition"
          >
            Clear all notifications
          </button>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <MainApp />
  </AuthProvider>
);

export default App;
