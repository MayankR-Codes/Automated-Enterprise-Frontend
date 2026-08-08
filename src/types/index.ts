export type Role = 'visitor' | 'employee' | 'admin' | 'executive' | 'security';

export type ImportanceLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface User {
  id?: string | number;
  uid?: string;
  name: string;
  email: string;
  role: Role;
  mobile?: string;
  company?: string;
  department?: string;
  designation?: string;
  branch?: string;
  details?: {
    company?: string;
    govIdType?: string;
    govIdNumber?: string;
    vehicleNumber?: string;
    laptopDetails?: string;
    employeeId?: string;
    department?: string;
    designation?: string;
    photoUrl?: string;
    govIdUrl?: string;
  };
}

export interface DemoNotification {
  id: string;
  requestId?: string;
  recipientEmail: string;
  channel: "email" | "sms" | "whatsapp" | "push";
  title: string;
  message: string;
  timestamp: string;
}


export interface AIAnalysisResult {
  importance: ImportanceLevel;
  confidence: number;
  summary: string;
  reasoning: string[];
  recommendedAction: string;
  suggestedDepartment?: string;
  suggestedAction?: string;
  requiresHumanApproval: boolean;
}

export interface VisitorRequest {
  id: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  companyName: string;
  branchId: string;
  branchName: string;
  hostEmployeeId: string;
  hostEmployeeName: string;
  hostDepartment: string;
  visitReason: string;
  visitDate: string;
  visitTime: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  aiAnalysis?: AIAnalysisResult;
  adminRemarks?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvalTimestamp?: string;
  qrVerificationId?: string;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Emergency Leave' | 'Other';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  documentUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  aiAnalysis?: AIAnalysisResult;
  adminRemarks?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  category: 'Infrastructure' | 'IT' | 'HR' | 'Transport' | 'Workplace' | 'Security' | 'Facilities' | 'Other';
  subject: string;
  description: string;
  location: string;
  priority: ImportanceLevel;
  attachmentUrl?: string;
  status: 'SUBMITTED' | 'AI_ANALYZED' | 'ADMIN_REVIEW' | 'SOLVED' | 'FORWARDED_TO_EXEC' | 'UNDER_EXEC_REVIEW' | 'RESOLVED';
  aiAnalysis?: AIAnalysisResult;
  adminResolution?: string;
  forwardingReason?: string;
  executiveResolution?: string;
  handledByAdminId?: string;
  handledByExecId?: string;
  updatedAt: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: Role;
  action: string;
  entityType: 'VISITOR' | 'LEAVE' | 'COMPLAINT' | 'AUTH';
  entityId: string;
  previousStatus?: string;
  newStatus: string;
  aiRecommendation?: string;
  humanDecision?: string;
  remarks?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'push';
  read?: boolean;
}

// --- Support Ticket & Triage Types ---
export type TriagePriority = 'P1-Critical' | 'P2-High' | 'P3-Medium' | 'P4-Low';
export type TicketStatus = 'INGESTED' | 'TRIAGED_PENDING_APPROVAL' | 'APPROVED_RESOLVED' | 'ESCALATED_MANUAL_REVIEW' | 'CLOSED';

export interface SupportTicket {
  id?: number;
  ticket_id: string;
  title: string;
  issue: string;
  user_name: string;
  user_email: string;
  customer_tier?: string;
  user_id?: number | string;
  category: string;
  priority: TriagePriority;
  urgency_score: number;
  sentiment?: string;
  assigned_to?: string;
  assigned_team: string;
  status: TicketStatus;
  draft_response?: string;
  internal_notes?: string;
  rag_sources?: string;
  approved_by?: string;
  approval_timestamp?: string;
  feedback_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface TicketAuditEntry {
  log_id: string;
  ticket_id: string;
  actor: string;
  action: string;
  reasoning_trace: string;
  timestamp: string;
}

// --- Chatbot & Interactive Action Types ---
export interface ChatPendingAction {
  action_type: 'create_hr_ticket' | 'create_it_ticket' | 'schedule_meeting' | string;
  title: string;
  category: string;
  assigned_team: string;
  priority?: string;
  urgency_score?: number;
  sla_target?: string;
  params?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  hasPendingAction?: boolean;
  pendingAction?: ChatPendingAction | null;
  agentName?: string;
}

// --- Financial Ledger & Analytics Types ---
export interface FinancialTransaction {
  id?: number;
  txn_id: string;
  txn_type: 'EXPENDITURE' | 'SALE';
  amount: number;
  description: string;
  category: string;
  user_name: string;
  user_email?: string;
  user_id?: number | string;
  status: 'RECORDED' | 'APPROVED' | 'REJECTED';
  reviewer?: string;
  created_at: string;
  approved_at?: string;
}

export interface FinancialSummary {
  total_sales: number;
  total_expenditure: number;
  net_balance: number;
  sales_count: number;
  expenditure_count: number;
  total_transactions: number;
  category_breakdown: Record<string, number>;
}

export interface AdminOperationalAnalytics {
  total_tickets: number;
  pending_approval: number;
  approved_count: number;
  escalated_count: number;
  automation_rate: string;
  priority_distribution: Record<string, number>;
  team_distribution: Record<string, number>;
  total_audit_events: number;
}
