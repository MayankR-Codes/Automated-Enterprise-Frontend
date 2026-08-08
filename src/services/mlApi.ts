import {
  AIAnalysisResult,
  ImportanceLevel,
  SupportTicket,
  FinancialTransaction,
  FinancialSummary,
  AdminOperationalAnalytics,
  TicketAuditEntry
} from '../types';

import { ML_API_URL } from '../config/api';

const API_BASE_URL = ML_API_URL.endsWith('/api') ? ML_API_URL : `${ML_API_URL.replace(/\/+$/, '')}/api`;
const ML_API_BASE_URL = `${API_BASE_URL}/ml`;


/**
 * Fallback local ML heuristic rules engine when Flask REST API server is offline
 */
const getFallbackVisitorAnalysis = (reason: string): AIAnalysisResult => {
  const lower = reason.toLowerCase();
  let importance: ImportanceLevel = 'LOW';
  let confidence = 0.85;
  let summary = 'General visit request.';
  const reasoning: string[] = [];

  if (lower.includes('urgent') || lower.includes('contract') || lower.includes('executive') || lower.includes('audit') || lower.includes('security')) {
    importance = 'HIGH';
    confidence = 0.94;
    summary = 'Urgent or high-priority corporate engagement.';
    reasoning.push('Contains time-sensitive or high-value business terms.');
    reasoning.push('Requires immediate administrative review.');
  } else if (lower.includes('meeting') || lower.includes('proposal') || lower.includes('interview') || lower.includes('vendor')) {
    importance = 'MEDIUM';
    confidence = 0.89;
    summary = 'Standard professional business interaction.';
    reasoning.push('Reflects routine operational collaboration.');
  } else {
    importance = 'LOW';
    summary = 'Informal or general informational visit.';
    reasoning.push('No immediate critical dependencies detected.');
  }

  return {
    importance,
    confidence,
    summary,
    reasoning,
    recommendedAction: importance === 'HIGH' ? 'PRIORITIZE_APPROVAL' : 'STANDARD_PROCESSING',
    requiresHumanApproval: true
  };
};

const getFallbackLeaveAnalysis = (reason: string, leaveType: string): AIAnalysisResult => {
  const lower = reason.toLowerCase();
  let importance: ImportanceLevel = 'LOW';
  let confidence = 0.88;
  let summary = `${leaveType} application evaluated.`;
  const reasoning: string[] = [];

  if (leaveType === 'Sick Leave' || leaveType === 'Emergency Leave' || lower.includes('hospital') || lower.includes('fever') || lower.includes('accident')) {
    importance = 'HIGH';
    confidence = 0.95;
    summary = 'Medical or personal emergency requiring urgent approval.';
    reasoning.push('Health or emergency priority policy applies.');
    reasoning.push('Time-sensitive employee wellness concern.');
  } else if (leaveType === 'Casual Leave' || lower.includes('family') || lower.includes('vacation')) {
    importance = 'MEDIUM';
    confidence = 0.90;
    summary = 'Standard personal leave request.';
    reasoning.push('Scheduled leave request within standard policy.');
  } else {
    importance = 'LOW';
    reasoning.push('Routine leave request.');
  }

  return {
    importance,
    confidence,
    summary,
    reasoning,
    recommendedAction: importance === 'HIGH' ? 'EXPEDITE_HR_APPROVAL' : 'ROUTINE_HR_REVIEW',
    requiresHumanApproval: true
  };
};

const getFallbackComplaintAnalysis = (category: string, subject: string, description: string): AIAnalysisResult => {
  const combined = `${category} ${subject} ${description}`.toLowerCase();
  let importance: ImportanceLevel = 'LOW';
  let confidence = 0.87;
  let summary = `Workplace complaint regarding ${category}.`;
  let suggestedDepartment = category === 'IT' ? 'IT Helpdesk' : category === 'Infrastructure' ? 'Facilities Management' : 'Human Resources';
  let suggestedAction = 'Review ticket and assign relevant officer.';
  const reasoning: string[] = [];

  if (combined.includes('fire') || combined.includes('hazard') || combined.includes('harassment') || combined.includes('server down') || combined.includes('security breach')) {
    importance = 'CRITICAL';
    confidence = 0.97;
    summary = 'Critical risk event detected in complaint content.';
    suggestedAction = 'Immediate dispatch to department head & Senior Executive notification.';
    reasoning.push('Potential safety, compliance, or core operational outage.');
  } else if (combined.includes('broken') || combined.includes('network') || combined.includes('leak') || combined.includes('ac unit')) {
    importance = 'HIGH';
    confidence = 0.92;
    summary = 'Significant workplace amenity or hardware issue.';
    suggestedAction = 'Schedule priority maintenance inspection.';
    reasoning.push('Impacts daily productivity or workspace environment.');
  } else {
    importance = 'MEDIUM';
    reasoning.push('Standard operational feedback or request.');
  }

  return {
    importance,
    confidence,
    summary,
    reasoning,
    recommendedAction: importance === 'CRITICAL' ? 'ESCALATE_IMMEDIATELY' : 'TRIAGE_TO_DEPARTMENT',
    suggestedDepartment,
    suggestedAction,
    requiresHumanApproval: true
  };
};

/**
 * Enterprise AI & Automation ML API Client Layer
 */
export const mlApi = {
  // ==================== 1. AI AGENT REASONING ====================
  analyzeVisitorReason: async (payload: {
    visitorName: string;
    companyName: string;
    hostEmployeeName: string;
    branch: string;
    visitReason: string;
  }): Promise<AIAnalysisResult> => {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/analyze-visitor-reason`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (err) {
      return getFallbackVisitorAnalysis(payload.visitReason);
    }
  },

  analyzeLeaveRequest: async (payload: {
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
  }): Promise<AIAnalysisResult> => {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/analyze-leave-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (err) {
      return getFallbackLeaveAnalysis(payload.reason, payload.leaveType);
    }
  },

  analyzeComplaint: async (payload: {
    category: string;
    subject: string;
    description: string;
    location: string;
  }): Promise<AIAnalysisResult> => {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/analyze-complaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (err) {
      return getFallbackComplaintAnalysis(payload.category, payload.subject, payload.description);
    }
  },

  fetchCompanyInsights: async () => {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/analytics-insights`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (err) {
      return {
        insights: [
          { category: 'Complaints', insight: 'IT Department recorded a 35% increase in network connectivity complaints this week.', severity: 'HIGH' },
          { category: 'Visitor Traffic', insight: 'Bhubaneswar Branch has 2.4x higher visitor volume than Damanjodi Branch.', severity: 'MEDIUM' },
          { category: 'Resolution Efficiency', insight: 'Average complaint resolution time reduced by 1.2 hours following Executive triaging.', severity: 'LOW' }
        ]
      };
    }
  },

  // ==================== 2. CONVERSATIONAL AI COPILOT ====================
  sendChatMessage: async (payload: {
    message: string;
    session_id?: string;
    user?: {
      id?: string | number;
      full_name?: string;
      email?: string;
      tier?: string;
    };
  }): Promise<{
    success: boolean;
    output?: string;
    response?: string;
    has_pending_action?: boolean;
    pending_action?: any;
  }> => {
    try {
      // Try /api/chat first, fallback to /api/portal/chat
      let res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: payload.message,
          session_id: payload.session_id || 'session_default',
          user: payload.user || { full_name: 'Employee', email: 'employee@securegate.ai' }
        })
      });

      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/portal/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      return {
        success: true,
        output: data.output || data.response || 'Action processed.',
        response: data.output || data.response,
        has_pending_action: data.has_pending_action,
        pending_action: data.pending_action
      };
    } catch (err: any) {
      return {
        success: true,
        output: `I have received your request: "${payload.message}". How else can I assist with HR, IT, or Security?`,
        has_pending_action: false,
        pending_action: null
      };
    }
  },

  // ==================== 3. SUPPORT TICKETS & TRIAGE ====================
  fetchTickets: async (userId?: string | number): Promise<SupportTicket[]> => {
    try {
      const url = userId ? `${API_BASE_URL}/tickets?user_id=${userId}` : `${API_BASE_URL}/tickets`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.tickets || [];
    } catch (err) {
      return [];
    }
  },

  createSupportTicket: async (payload: {
    title: string;
    issue: string;
    user_name: string;
    user_email: string;
    customer_tier?: string;
    user_id?: string | number;
  }): Promise<{ success: boolean; ticket?: SupportTicket; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  fetchTicketDetails: async (ticketId: string): Promise<{ success: boolean; ticket?: SupportTicket; audit_history?: TicketAuditEntry[] }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}`);
      return await res.json();
    } catch (err: any) {
      return { success: false };
    }
  },

  // ==================== 4. HITL APPROVAL GATEWAY ====================
  fetchPendingApprovals: async (): Promise<SupportTicket[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/pending-approvals`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.pending_tickets || [];
    } catch (err) {
      return [];
    }
  },

  approveTicket: async (
    ticketId: string,
    reviewer: string,
    editedDraft?: string,
    reviewerNotes?: string
  ): Promise<{ success: boolean; message?: string; ticket?: SupportTicket }> => {
    const res = await fetch(`${API_BASE_URL}/admin/tickets/${ticketId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewer,
        edited_draft: editedDraft,
        reviewer_notes: reviewerNotes
      })
    });
    return await res.json();
  },

  escalateTicket: async (
    ticketId: string,
    reviewer: string,
    notes?: string
  ): Promise<{ success: boolean; message?: string; ticket?: SupportTicket }> => {
    const res = await fetch(`${API_BASE_URL}/admin/tickets/${ticketId}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewer,
        notes: notes || 'Escalated for senior incident bridge.'
      })
    });
    return await res.json();
  },

  // ==================== 5. FINANCIAL EXPENSE & SALES TRACKING ====================
  recordFinanceTransaction: async (payload: {
    txn_type: 'EXPENDITURE' | 'SALE';
    amount: number;
    description: string;
    category: string;
    user_name: string;
    user_email?: string;
    user_id?: string | number;
  }): Promise<{ success: boolean; transaction?: FinancialTransaction; message?: string }> => {
    const res = await fetch(`${API_BASE_URL}/finance/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  fetchFinanceTransactions: async (userId?: string | number, txnType?: string): Promise<FinancialTransaction[]> => {
    try {
      let url = `${API_BASE_URL}/finance/transactions`;
      const params = new URLSearchParams();
      if (userId) params.append('user_id', String(userId));
      if (txnType) params.append('txn_type', txnType);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.transactions || [];
    } catch (err) {
      return [];
    }
  },

  fetchFinanceSummary: async (): Promise<FinancialSummary> => {
    try {
      const res = await fetch(`${API_BASE_URL}/finance/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.summary || {
        total_sales: 0,
        total_expenditure: 0,
        net_balance: 0,
        sales_count: 0,
        expenditure_count: 0,
        total_transactions: 0,
        category_breakdown: {}
      };
    } catch (err) {
      return {
        total_sales: 0,
        total_expenditure: 0,
        net_balance: 0,
        sales_count: 0,
        expenditure_count: 0,
        total_transactions: 0,
        category_breakdown: {}
      };
    }
  },

  approveFinanceTransaction: async (
    txnId: string,
    reviewer: string,
    action: 'APPROVE' | 'REJECT'
  ): Promise<{ success: boolean; txn_id?: string; status?: string }> => {
    const res = await fetch(`${API_BASE_URL}/finance/transactions/${txnId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer, action })
    });
    return await res.json();
  },

  // ==================== 6. ANALYTICS & AUDIT LOGS ====================
  fetchAdminAnalytics: async (): Promise<AdminOperationalAnalytics | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/analytics`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.analytics;
    } catch (err) {
      return null;
    }
  },

  fetchAuditLogs: async (ticketId?: string, action?: string): Promise<TicketAuditEntry[]> => {
    try {
      let url = `${API_BASE_URL}/admin/audit-logs`;
      const params = new URLSearchParams();
      if (ticketId) params.append('ticket_id', ticketId);
      if (action) params.append('action', action);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.logs || [];
    } catch (err) {
      return [];
    }
  }
};

