import React, { createContext, useContext, useState, useEffect } from "react";
import { User, DemoNotification } from "../types";
import { apiEndpoint } from "../config/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  theme: "light" | "dark";
  notifications: DemoNotification[];
  login: (userData: User, jwtToken: string) => void;
  logout: () => void;
  toggleTheme: () => void;
  clearNotifications: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [notifications, setNotifications] = useState<DemoNotification[]>([]);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("sg_token");
    const savedUser = localStorage.getItem("sg_user");
    const savedTheme = localStorage.getItem("sg_theme") as "light" | "dark" | null;

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("sg_user");
      }
    }

    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Poll notifications in demo mode
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(apiEndpoint("/api/notifications"));
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            // Append new notifications, filter duplicates
            setNotifications(prev => {
              const prevIds = new Set(prev.map(n => n.id));
              const newNotis = data.filter((n: DemoNotification) => !prevIds.has(n.id));
              return [...newNotis, ...prev]; // Latest first
            });
          }
        }
      } catch (e) {
        // Silent catch for network outages
      }
    };

    const interval = setInterval(poll, 3000);
    poll(); // run once immediately

    return () => clearInterval(interval);
  }, []);

  const login = (userData: User, jwtToken: string) => {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem("sg_token", jwtToken);
    localStorage.setItem("sg_user", JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("sg_token");
    localStorage.removeItem("sg_user");
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("sg_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const clearNotifications = async () => {
    try {
      await fetch(apiEndpoint("/api/notifications/clear"), { method: "POST" });
      setNotifications([]);
    } catch (e) {
      setNotifications([]);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        theme,
        notifications,
        login,
        logout,
        toggleTheme,
        clearNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
