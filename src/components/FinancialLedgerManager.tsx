import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { mlApi } from "../services/mlApi";
import { FinancialTransaction, FinancialSummary } from "../types";
import {
  DollarSign, TrendingUp, TrendingDown, PlusCircle, CheckCircle2,
  XCircle, RefreshCw, Layers, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface FinancialLedgerManagerProps {
  isAdmin?: boolean;
}

export const FinancialLedgerManager: React.FC<FinancialLedgerManagerProps> = ({ isAdmin = false }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [txnType, setTxnType] = useState<"EXPENDITURE" | "SALE">("EXPENDITURE");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("Meals & Entertainment");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [txns, sum] = await Promise.all([
        mlApi.fetchFinanceTransactions(isAdmin ? undefined : (user?.uid || user?.id)),
        mlApi.fetchFinanceSummary()
      ]);
      setTransactions(txns);
      setSummary(sum);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin, user]);

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !description.trim()) return;

    setSubmitting(true);
    setMsg("");
    try {
      const res = await mlApi.recordFinanceTransaction({
        txn_type: txnType,
        amount: numAmount,
        description,
        category,
        user_name: user?.name || "Employee",
        user_email: user?.email || "employee@securegate.ai",
        user_id: user?.uid || user?.id
      });

      if (res.success && res.transaction) {
        setTransactions(prev => [res.transaction!, ...prev]);
        setShowAddModal(false);
        setAmount("");
        setDescription("");
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
        loadData();
      } else {
        setMsg(res.message || "Failed to record transaction.");
      }
    } catch (err: any) {
      setMsg(err.message || "Error submitting transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveReject = async (txnId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await mlApi.approveFinanceTransaction(txnId, user?.name || "Admin Manager", action);
      if (res.success) {
        setTransactions(prev =>
          prev.map(t => (t.txn_id === txnId ? { ...t, status: action === "APPROVE" ? "APPROVED" : "REJECTED" } : t))
        );
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const categories = txnType === "EXPENDITURE"
    ? ["Meals & Entertainment", "Travel & Lodging", "Software & Subscriptions", "Hardware & Equipment", "Office Supplies", "Other"]
    : ["Enterprise Sales", "Professional Services", "Consulting", "Contract Renewal", "Other"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <DollarSign className="text-emerald-400" size={22} />
            {isAdmin ? "Enterprise Financial Ledger & Ledger Approvals" : "My Business Expenses & Sales Tracking"}
          </h2>
          <p className="text-xs text-slate-400">
            Real-time ledger accounting, automated status audits, and reimbursement approvals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all active:scale-95 flex items-center gap-1.5 text-xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
          >
            <PlusCircle size={15} /> Record Expense / Sale
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-emerald-500/20 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Ingested</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><TrendingUp size={18} /></div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
              ${summary.total_sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{summary.sales_count} closed deals</div>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-rose-500/20 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Expenditures</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400"><TrendingDown size={18} /></div>
            </div>
            <div className="text-3xl font-extrabold text-rose-400 mt-2 font-mono">
              ${summary.total_expenditure.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{summary.expenditure_count} recorded expenses</div>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-indigo-500/20 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Operating Balance</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400"><DollarSign size={18} /></div>
            </div>
            <div className={`text-3xl font-extrabold mt-2 font-mono ${summary.net_balance >= 0 ? "text-indigo-300" : "text-rose-400"}`}>
              ${summary.net_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{summary.total_transactions} total ledger records</div>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <Layers size={16} className="text-indigo-400" /> Transaction Ledger
          </h3>
          <span className="text-xs text-slate-500 font-mono">{transactions.length} Records</span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No financial transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Txn ID</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Requester</th>
                  <th className="p-4">Status</th>
                  {isAdmin && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {transactions.map((t) => (
                  <tr key={t.txn_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-400">{t.txn_id}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.txn_type === "SALE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {t.txn_type}
                      </span>
                    </td>
                    <td className={`p-4 font-mono font-bold text-sm ${t.txn_type === "SALE" ? "text-emerald-400" : "text-slate-200"}`}>
                      {t.txn_type === "SALE" ? "+" : "-"}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 max-w-xs text-slate-300 truncate" title={t.description}>{t.description}</td>
                    <td className="p-4 text-slate-400">{t.category}</td>
                    <td className="p-4 text-slate-300 font-medium">{t.user_name}</td>
                    <td className="p-4">
                      {t.status === "APPROVED" ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 w-max">
                          <CheckCircle2 size={11} /> Approved
                        </span>
                      ) : t.status === "REJECTED" ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1 w-max">
                          <XCircle size={11} /> Rejected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1 w-max">
                          <Clock size={11} /> Recorded
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="p-4 text-right">
                        {t.status === "RECORDED" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveReject(t.txn_id, "APPROVE")}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 transition-all"
                              title="Approve expense"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              onClick={() => handleApproveReject(t.txn_id, "REJECT")}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 transition-all"
                              title="Reject expense"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Processed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <DollarSign className="text-emerald-400" size={18} /> Record Financial Transaction
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              {msg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                  {msg}
                </div>
              )}

              <form onSubmit={handleRecordTransaction} className="space-y-4">
                <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTxnType("EXPENDITURE")}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                      txnType === "EXPENDITURE" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Expenditure
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxnType("SALE")}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                      txnType === "SALE" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Sale / Ingestion
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 180.50"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Description / Purpose
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Lunch meeting with prospect client from Apex Corp"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? "Recording..." : "Record Transaction"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
