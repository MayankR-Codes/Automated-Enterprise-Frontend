# Automated Enterprise Frontend - SecureGate AI

Production-ready React 18 + Vite + Tailwind CSS Single Page Application (SPA) for the **Automated Enterprise Multi-Agent AI System**.

---

## 🚀 Overview

This frontend provides specialized portals with Human-in-the-Loop (HITL) approval gateways and AI copilot integration:
- 🛡️ **Admin Portal**: Operations monitoring, Human-in-the-Loop email dispatch/rejection, visitor security logs, and financial transaction approval.
- 👔 **Employee Portal**: AI Conversational Copilot (RAG knowledge base), IT Support Ticket creation/tracking, and Leave/Expense recording.
- 📊 **Executive Portal**: Real-time KPI summaries, system health metrics, and high-risk security escalation logs.
- 🎫 **Visitor Check-in**: ID OCR scanning, dynamic visitor registration, and instant QR Pass generation.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS + Custom Mesh & Glassmorphism Design System
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Data Visualization**: Chart.js + React-Chartjs-2
- **Hosting**: Optimized for **Vercel** with SPA routing (`vercel.json`)

---

## 🌐 Environment Configuration

Create a `.env` file in the root directory (refer to `.env.example`):

```env
# Backend Service URLs (Set to your Render deployment URL in production)
VITE_BACKEND_URL=https://your-node-backend.onrender.com
VITE_ML_API_URL=https://your-python-backend.onrender.com
```

---

## 📦 Getting Started Locally

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```

---

## 🚀 Deploy to Vercel

1. Import this repository in [Vercel Dashboard](https://vercel.com).
2. Set Framework Preset: **Vite**.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Configure Environment Variables (`VITE_BACKEND_URL`, `VITE_ML_API_URL`).
6. Deploy!
