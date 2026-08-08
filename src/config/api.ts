/**
 * Global API Configuration for SecureGate AI & Enterprise ML Automation
 * Dynamically resolves Render deployment URLs or local development fallback.
 */

// Enterprise Backend URL deployed on Render
export const RENDER_BACKEND_URL = "https://automated-enterprise-backend.onrender.com";

// Core Backend URL (Auth, MFA, Gate Passes, System Lists)
export const BACKEND_URL = 
  (import.meta as any).env?.VITE_BACKEND_URL || 
  (import.meta as any).env?.VITE_API_URL || 
  RENDER_BACKEND_URL;

// Enterprise ML Python Flask Backend URL (RAG Chatbot, HITL Approvals, Support Tickets, Finance Ledger)
export const ML_API_URL = 
  (import.meta as any).env?.VITE_ML_API_URL || 
  (import.meta as any).env?.VITE_FLASK_API_URL || 
  (import.meta as any).env?.VITE_BACKEND_URL || 
  RENDER_BACKEND_URL;

/**
 * Constructs a fully-qualified URL for backend endpoints
 * Example: apiEndpoint('/api/auth/login') -> 'https://automated-enterprise-backend.onrender.com/api/auth/login'
 */
export const apiEndpoint = (path: string): string => {
  const base = BACKEND_URL.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

/**
 * Constructs a fully-qualified URL for Python ML backend endpoints
 * Example: mlApiEndpoint('/api/chat') -> 'https://automated-enterprise-backend.onrender.com/api/chat'
 */
export const mlApiEndpoint = (path: string): string => {
  const base = ML_API_URL.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};
