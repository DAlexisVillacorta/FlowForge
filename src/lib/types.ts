export interface Organization {
  id: string;
  name: string;
  cuit: string;
  fiscalCategory: string;
  createdAt: Date;
}

export interface User {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: "admin" | "viewer";
  avatarUrl?: string;
}

export interface BankAccount {
  id: string;
  orgId: string;
  bankName: string;
  accountNumber: string;
  cbu: string;
  currency: "ARS" | "USD";
}

export interface BankStatement {
  id: string;
  bankAccountId: string;
  uploadedBy: string;
  periodStart: Date;
  periodEnd: Date;
  filePath: string;
  fileType: "pdf" | "csv";
  status:
    | "processing"
    | "classified"
    | "reviewing"
    | "reconciled"
    | "completed";
  closingBalance: number;
  transactionCount: number;
  matchedCount: number;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  statementId: string;
  transactionDate: Date;
  description: string;
  amount: number;
  type: "credit" | "debit";
  aiCategory: TransactionCategory;
  userCategory?: TransactionCategory;
  aiConfidence: number;
  matchStatus: "unmatched" | "suggested" | "confirmed" | "rejected";
  matchedInvoiceId?: string;
}

export type TransactionCategory =
  | "pago_proveedor"
  | "cobro_cliente"
  | "impuesto"
  | "comision_bancaria"
  | "transferencia_interna"
  | "salario"
  | "alquiler"
  | "servicio"
  | "retencion"
  | "percepcion"
  | "iva"
  | "otros";

export interface Invoice {
  id: string;
  orgId: string;
  invoiceNumber: string;
  type:
    | "factura_a"
    | "factura_b"
    | "factura_c"
    | "nota_credito"
    | "nota_debito"
    | "recibo";
  counterpartyName: string;
  counterpartyCuit: string;
  netAmount: number;
  ivaAmount: number;
  totalAmount: number;
  issueDate: Date;
  dueDate: Date;
  status: "pending" | "partially_matched" | "matched" | "overdue";
}

export interface ReconciliationMatch {
  id: string;
  transactionId: string;
  invoiceId: string;
  confirmedBy?: string;
  matchType: "exact" | "partial" | "grouped";
  confidenceScore: number;
  status: "suggested" | "confirmed" | "rejected";
  createdAt: Date;
}

export interface ClassificationRule {
  id: string;
  orgId: string;
  pattern: string;
  category: TransactionCategory;
  source: "ai_generated" | "user_defined";
  timesApplied: number;
}

export interface Report {
  id: string;
  orgId: string;
  statementId: string;
  reportType: "conciliation" | "monthly_summary" | "tax_detail";
  filePath: string;
  summaryData: {
    totalIncome: number;
    totalExpense: number;
    matchedTransactions: number;
    unmatchedTransactions: number;
    pendingReview: number;
  };
  generatedAt: Date;
}

// ── Dashboard additional types ──────────────────────────────────────────────

export interface DashboardStats {
  totalProcessed: number;
  aiAccuracy: number; // porcentaje 0-100
  timeSaved: number;  // horas
  pendingReview: number;
}

export interface MonthlyTrend {
  month: string;    // ej. "Oct 2025"
  income: number;
  expense: number;
  matched: number;
  total: number;
}

export interface CategoryBreakdown {
  category: TransactionCategory;
  amount: number;
  count: number;
  percentage: number;
}

export type RecentActivityType =
  | "upload"
  | "match_confirmed"
  | "match_suggested"
  | "classification"
  | "report_generated"
  | "rule_created";

export interface RecentActivity {
  id: string;
  type: RecentActivityType;
  description: string;
  timestamp: Date;
  meta?: Record<string, unknown>;
}
