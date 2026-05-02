import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  fullName: z.string().min(2, "Nombre debe tener al menos 2 caracteres").max(100),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Contraseña debe tener al menos 8 caracteres"),
  companyName: z.string().min(2, "Nombre de empresa requerido").max(100),
  cuit: z.string().regex(/^\d{2}-\d{8}-\d$/, "CUIT inválido (formato: XX-XXXXXXXX-X)"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

// ── Bank Account ──────────────────────────────────────────────────────────────

export const bankAccountSchema = z.object({
  bankName: z.string().min(2).max(100),
  accountNumber: z.string().min(1).max(50),
  cbu: z.string().regex(/^\d{22}$/, "CBU debe tener 22 dígitos"),
  currency: z.enum(["ARS", "USD"]).default("ARS"),
});

// ── Bank Statement ────────────────────────────────────────────────────────────

export const statementSchema = z.object({
  bankAccountId: z.string().cuid(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  fileType: z.enum(["pdf", "csv"]),
}).refine((data) => data.periodEnd > data.periodStart, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
});

// ── Transaction ───────────────────────────────────────────────────────────────

export const transactionUpdateSchema = z.object({
  userCategory: z.enum([
    "pago_proveedor", "cobro_cliente", "impuesto", "comision_bancaria",
    "transferencia_interna", "salario", "alquiler", "servicio",
    "retencion", "percepcion", "iva", "otros",
  ]).optional(),
  matchStatus: z.enum(["unmatched", "suggested", "confirmed", "rejected"]).optional(),
  matchedInvoiceId: z.string().nullable().optional(),
});

export const transactionBulkUpdateSchema = z.object({
  ids: z.array(z.string()),
  updates: transactionUpdateSchema,
});

// ── Invoice ───────────────────────────────────────────────────────────────────

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1).max(50),
  type: z.enum(["factura_a", "factura_b", "factura_c", "nota_credito", "nota_debito", "recibo"]),
  counterpartyName: z.string().min(2).max(200),
  counterpartyCuit: z.string().regex(/^\d{2}-\d{8}-\d$/, "CUIT inválido"),
  netAmount: z.number(),
  ivaAmount: z.number().default(0),
  totalAmount: z.number(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
});

export const invoiceUpdateSchema = z.object({
  status: z.enum(["pending", "partially_matched", "matched", "overdue"]).optional(),
});

// ── Reconciliation Match ──────────────────────────────────────────────────────

export const matchSchema = z.object({
  transactionId: z.string().cuid(),
  invoiceId: z.string().cuid(),
  matchType: z.enum(["exact", "partial", "grouped"]),
});

export const matchUpdateSchema = z.object({
  status: z.enum(["suggested", "confirmed", "rejected"]),
});

// ── Classification Rule ───────────────────────────────────────────────────────

export const ruleSchema = z.object({
  pattern: z.string().min(1).max(500),
  category: z.enum([
    "pago_proveedor", "cobro_cliente", "impuesto", "comision_bancaria",
    "transferencia_interna", "salario", "alquiler", "servicio",
    "retencion", "percepcion", "iva", "otros",
  ]),
  source: z.enum(["ai_generated", "user_defined"]).default("user_defined"),
});

// ── Report ────────────────────────────────────────────────────────────────────

export const reportSchema = z.object({
  reportType: z.enum(["conciliation", "monthly_summary", "tax_detail"]),
  period: z.string().min(1),
  format: z.enum(["pdf", "excel"]).default("pdf"),
});

// ── Query params ──────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});
