import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { put } from "@vercel/blob";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface ReportData {
  orgId: string;
  statementId: string;
  reportType: "conciliation" | "monthly_summary" | "tax_detail";
  format: "pdf" | "excel";
  period: string;
}

const REPORTS_DIR = process.env.REPORTS_DIR ?? "./reports";

function hasBlobToken(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function saveLocally(
  buffer: Buffer,
  relativeName: string,
): Promise<{ filePath: string; fileName: string }> {
  const absolutePath = path.resolve(process.cwd(), REPORTS_DIR, relativeName);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);
  return { filePath: absolutePath, fileName: relativeName };
}

export async function generateReport(data: ReportData): Promise<{ filePath: string; fileName: string }> {
  const timestamp = Date.now();
  const fileName = `${data.reportType}_${timestamp}.${data.format === "excel" ? "xlsx" : "pdf"}`;

  let buffer: Buffer;

  if (data.format === "pdf") {
    buffer = await generatePDFBuffer(data);
  } else {
    buffer = await generateExcelBuffer(data);
  }

  if (hasBlobToken()) {
    const blob = await put(`reports/${fileName}`, buffer, {
      access: "public",
      contentType: data.format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    return { filePath: blob.url, fileName: blob.pathname };
  }

  return saveLocally(buffer, fileName);
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const COLORS = {
  primary: "#0EA5E9",       // brand cyan
  primaryDark: "#0369A1",
  primaryLight: "#E0F2FE",
  ai: "#6366F1",
  success: "#10B981",
  successLight: "#D1FAE5",
  successDark: "#047857",
  danger: "#EF4444",
  dangerLight: "#FEE2E2",
  dangerDark: "#B91C1C",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  warningDark: "#B45309",
  ink: "#0F172A",
  text: "#1F2937",
  muted: "#64748B",
  subtle: "#94A3B8",
  border: "#E2E8F0",
  rowAlt: "#F8FAFC",
  bg: "#FFFFFF",
  cardBg: "#F1F5F9",
} as const;

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  pago_proveedor:       { label: "Pago a proveedor",     color: "#9A3412", bg: "#FFEDD5" },
  cobro_cliente:        { label: "Cobro de cliente",     color: "#155E75", bg: "#CFFAFE" },
  impuesto:             { label: "Impuesto",             color: "#991B1B", bg: "#FEE2E2" },
  comision_bancaria:    { label: "Comisión bancaria",    color: "#374151", bg: "#E5E7EB" },
  transferencia_interna:{ label: "Transferencia interna",color: "#3730A3", bg: "#E0E7FF" },
  salario:              { label: "Salario",              color: "#5B21B6", bg: "#EDE9FE" },
  alquiler:             { label: "Alquiler",             color: "#92400E", bg: "#FEF3C7" },
  servicio:             { label: "Servicio",             color: "#0F766E", bg: "#CCFBF1" },
  retencion:            { label: "Retención",            color: "#9F1239", bg: "#FFE4E6" },
  percepcion:           { label: "Percepción",           color: "#9D174D", bg: "#FCE7F3" },
  iva:                  { label: "IVA",                  color: "#3F6212", bg: "#ECFCCB" },
  otros:                { label: "Otros",                color: "#475569", bg: "#F1F5F9" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: "Confirmado", color: COLORS.successDark, bg: COLORS.successLight },
  suggested: { label: "Sugerido",   color: COLORS.warningDark, bg: COLORS.warningLight },
  unmatched: { label: "Sin match",  color: COLORS.muted,       bg: COLORS.cardBg },
  rejected:  { label: "Rechazado",  color: COLORS.dangerDark,  bg: COLORS.dangerLight },
};

const REPORT_TITLE: Record<ReportData["reportType"], string> = {
  conciliation: "Reporte de Conciliación Bancaria",
  monthly_summary: "Resumen Mensual",
  tax_detail: "Detalle Impositivo",
};

const REPORT_SUBTITLE: Record<ReportData["reportType"], string> = {
  conciliation: "Análisis de movimientos bancarios y conciliación con facturas",
  monthly_summary: "Vista consolidada del flujo de caja mensual",
  tax_detail: "Desglose de impuestos, retenciones y percepciones",
};

// ── Layout constants ─────────────────────────────────────────────────────────

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 42;
const MARGIN_TOP = 40;
const MARGIN_BOTTOM = 50;
const CONTENT_W = PAGE_W - 2 * MARGIN_X;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrencyAR(n: number): string {
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ellipsis(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

// PDFKit type alias — using `any` because pdfkit's types are loose and we use chained API extensively.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any;

function drawPill(
  doc: Doc,
  x: number,
  y: number,
  text: string,
  bg: string,
  fg: string,
  opts: { fontSize?: number; padX?: number; padY?: number } = {},
): number {
  const fontSize = opts.fontSize ?? 7.5;
  const padX = opts.padX ?? 5;
  const padY = opts.padY ?? 2.5;
  doc.font("Helvetica-Bold").fontSize(fontSize);
  const textW = doc.widthOfString(text);
  const w = textW + padX * 2;
  const h = fontSize + padY * 2;
  doc.roundedRect(x, y, w, h, h / 2).fillColor(bg).fill();
  doc.fillColor(fg).text(text, x + padX, y + padY - 0.5, { lineBreak: false, width: textW + 2 });
  return w;
}

function _drawHorizontalRule(doc: Doc, y: number, color = COLORS.border) {
  doc.strokeColor(color).lineWidth(0.5).moveTo(MARGIN_X, y).lineTo(PAGE_W - MARGIN_X, y).stroke();
}

// ── Header (cover + repeated header on subsequent pages) ─────────────────────

function drawCoverHeader(
  doc: Doc,
  reportType: ReportData["reportType"],
  org: { name: string; cuit: string; fiscalCategory: string } | null,
  statement: {
    bankName: string;
    accountNumber?: string;
    periodStart: Date;
    periodEnd: Date;
    closingBalance: number;
  } | null,
): number {
  // Top color band
  doc.rect(0, 0, PAGE_W, 90).fillColor(COLORS.primaryDark).fill();
  doc.rect(0, 90, PAGE_W, 4).fillColor(COLORS.primary).fill();

  // Brand
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("FlowForge", MARGIN_X, 28, { lineBreak: false });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#BAE6FD")
    .text("Conciliación bancaria automatizada con IA", MARGIN_X, 56, { lineBreak: false });

  // Right side: report type + date generated
  const dateLabel = `Generado ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}`;
  const dateLabelW = doc.widthOfString(dateLabel);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#BAE6FD")
    .text(dateLabel, PAGE_W - MARGIN_X - dateLabelW, 35, { lineBreak: false });

  // Report title section
  let y = 120;
  doc
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(REPORT_TITLE[reportType], MARGIN_X, y, { width: CONTENT_W, lineBreak: false });
  y += 26;

  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(10)
    .text(REPORT_SUBTITLE[reportType], MARGIN_X, y, { width: CONTENT_W });
  y += 24;

  // Info card with org + statement details (two columns)
  const cardH = 110;
  doc
    .roundedRect(MARGIN_X, y, CONTENT_W, cardH, 8)
    .fillColor(COLORS.cardBg)
    .fill();

  const colW = (CONTENT_W - 24) / 2;
  const col1X = MARGIN_X + 16;
  const col2X = MARGIN_X + 16 + colW;
  let cy = y + 14;

  // Section labels
  doc
    .fillColor(COLORS.subtle)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("EMPRESA", col1X, cy, { lineBreak: false })
    .text("EXTRACTO BANCARIO", col2X, cy, { lineBreak: false });
  cy += 14;

  // Org details
  doc
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(org?.name ?? "—", col1X, cy, { width: colW - 16, lineBreak: false });
  cy += 14;
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(9)
    .text(`CUIT: ${org?.cuit ?? "—"}`, col1X, cy, { width: colW - 16, lineBreak: false });
  cy += 12;
  doc
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(`Categoría: ${org?.fiscalCategory ?? "—"}`, col1X, cy, { width: colW - 16, lineBreak: false });

  // Statement details (col 2)
  cy = y + 28;
  doc
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(statement?.bankName ?? "—", col2X, cy, { width: colW - 16, lineBreak: false });
  cy += 14;
  if (statement) {
    const periodStr = `${format(statement.periodStart, "dd/MM/yyyy")} — ${format(statement.periodEnd, "dd/MM/yyyy")}`;
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(9)
      .text(`Período: ${periodStr}`, col2X, cy, { width: colW - 16, lineBreak: false });
    cy += 12;
    doc
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(
        `Saldo de cierre: $${formatCurrencyAR(statement.closingBalance)}`,
        col2X,
        cy,
        { width: colW - 16, lineBreak: false },
      );
  }

  return y + cardH + 22;
}

function drawRunningHeader(doc: Doc, reportType: ReportData["reportType"]) {
  doc.rect(0, 0, PAGE_W, 32).fillColor(COLORS.primaryDark).fill();
  doc.rect(0, 32, PAGE_W, 2).fillColor(COLORS.primary).fill();
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("FlowForge", MARGIN_X, 11, { lineBreak: false });

  const t = REPORT_TITLE[reportType];
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#BAE6FD")
    .text(t, PAGE_W - MARGIN_X - doc.widthOfString(t), 12.5, { lineBreak: false });
}

// ── Section title ────────────────────────────────────────────────────────────

function drawSectionTitle(doc: Doc, y: number, title: string, subtitle?: string): number {
  // Accent bar
  doc.rect(MARGIN_X, y + 4, 4, 18).fillColor(COLORS.primary).fill();

  doc
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(title, MARGIN_X + 12, y + 4, { lineBreak: false });

  if (subtitle) {
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(9)
      .text(subtitle, MARGIN_X + 12, y + 22, { width: CONTENT_W - 12 });
    return y + 42;
  }
  return y + 32;
}

// ── KPI card ─────────────────────────────────────────────────────────────────

interface Kpi {
  label: string;
  value: string;
  accent: string;
  hint?: string;
}

function drawKpiGrid(doc: Doc, y: number, kpis: Kpi[]): number {
  const perRow = 3;
  const gap = 10;
  const cardW = (CONTENT_W - gap * (perRow - 1)) / perRow;
  const cardH = 70;

  for (let i = 0; i < kpis.length; i++) {
    const kpi = kpis[i];
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    const x = MARGIN_X + col * (cardW + gap);
    const cardY = y + row * (cardH + gap);

    // Card background with border (single fillAndStroke so border renders)
    doc
      .lineWidth(0.8)
      .roundedRect(x, cardY, cardW, cardH, 6)
      .fillAndStroke("#FFFFFF", COLORS.border);

    // Left accent bar (overdraws on top of the card)
    doc.rect(x, cardY, 4, cardH).fill(kpi.accent);

    // Label
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .text(kpi.label.toUpperCase(), x + 14, cardY + 12, {
        width: cardW - 24,
        characterSpacing: 0.4,
        lineBreak: false,
      });

    // Value
    doc
      .fillColor(COLORS.ink)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(kpi.value, x + 14, cardY + 28, {
        width: cardW - 24,
        lineBreak: false,
      });

    // Hint
    if (kpi.hint) {
      doc
        .fillColor(COLORS.subtle)
        .font("Helvetica")
        .fontSize(8)
        .text(kpi.hint, x + 14, cardY + cardH - 16, {
          width: cardW - 24,
          lineBreak: false,
        });
    }
  }

  const rows = Math.ceil(kpis.length / perRow);
  return y + rows * (cardH + gap);
}

// ── Category breakdown bars ──────────────────────────────────────────────────

interface CategoryAgg {
  category: string;
  total: number;
  count: number;
}

function drawCategoryChart(doc: Doc, y: number, items: CategoryAgg[], grandTotal: number): number {
  if (items.length === 0 || grandTotal <= 0) return y;

  const top = items.slice(0, 8);
  const labelW = 140;
  const amountW = 110;
  const barX = MARGIN_X + labelW + 10;
  const barMaxW = CONTENT_W - labelW - amountW - 20;
  const rowH = 22;

  for (let i = 0; i < top.length; i++) {
    const item = top[i];
    const meta = CATEGORY_META[item.category] ?? CATEGORY_META.otros;
    const rowY = y + i * rowH;

    // Label (left)
    doc
      .fillColor(COLORS.text)
      .font("Helvetica")
      .fontSize(9)
      .text(meta.label, MARGIN_X, rowY + 5, { width: labelW - 4, lineBreak: false });

    // Bar background
    doc.roundedRect(barX, rowY + 7, barMaxW, 8, 4).fillColor(COLORS.cardBg).fill();

    // Bar fill
    const pct = item.total / grandTotal;
    const w = Math.max(2, barMaxW * pct);
    doc.roundedRect(barX, rowY + 7, w, 8, 4).fillColor(meta.color).fill();

    // Amount (right)
    const amountStr = `$${formatCurrencyAR(item.total)}`;
    const amountStrW = doc.widthOfString(amountStr);
    doc
      .fillColor(COLORS.ink)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(amountStr, PAGE_W - MARGIN_X - amountStrW, rowY + 5, { lineBreak: false });

    // Count subtitle
    const countStr = `${item.count} mov.`;
    const countStrW = doc.widthOfString(countStr);
    doc
      .fillColor(COLORS.subtle)
      .font("Helvetica")
      .fontSize(7.5)
      .text(countStr, PAGE_W - MARGIN_X - countStrW, rowY + 17, { lineBreak: false });
  }

  return y + top.length * rowH + 6;
}

// ── Transactions table ───────────────────────────────────────────────────────

interface TableTx {
  transactionDate: Date;
  description: string;
  amount: number;
  type: "credit" | "debit";
  aiCategory: string;
  userCategory: string | null;
  matchStatus: "unmatched" | "suggested" | "confirmed" | "rejected";
}

const COL_WIDTHS = [60, 230, 50, 80, 50, 45]; // Fecha, Descripción, Tipo, Monto, Cat, Estado
const COL_X = COL_WIDTHS.map((_, i, arr) => MARGIN_X + arr.slice(0, i).reduce((a, b) => a + b, 0));

function drawTableHeader(doc: Doc, y: number): number {
  const headerH = 22;
  doc.roundedRect(MARGIN_X, y, CONTENT_W, headerH, 4).fillColor(COLORS.primaryDark).fill();
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#FFFFFF");

  const headers = ["FECHA", "DESCRIPCIÓN", "TIPO", "MONTO", "CATEGORÍA", "ESTADO"];
  headers.forEach((h, i) => {
    const align = i === 3 ? "right" : "left";
    doc.text(h, COL_X[i] + 8, y + 7, {
      width: COL_WIDTHS[i] - 16,
      align,
      lineBreak: false,
    });
  });
  return y + headerH;
}

function drawTableRow(
  doc: Doc,
  y: number,
  tx: TableTx,
  altRow: boolean,
): number {
  const rowH = 24;

  if (altRow) {
    doc.rect(MARGIN_X, y, CONTENT_W, rowH).fillColor(COLORS.rowAlt).fill();
  }

  // Bottom border
  doc.strokeColor(COLORS.border).lineWidth(0.4).moveTo(MARGIN_X, y + rowH).lineTo(PAGE_W - MARGIN_X, y + rowH).stroke();

  // Date
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(8)
    .text(format(tx.transactionDate, "dd/MM/yyyy"), COL_X[0] + 8, y + 8, {
      width: COL_WIDTHS[0] - 12,
      lineBreak: false,
    });

  // Description
  doc
    .fillColor(COLORS.text)
    .font("Helvetica")
    .fontSize(8.5)
    .text(ellipsis(tx.description, 60), COL_X[1] + 8, y + 8, {
      width: COL_WIDTHS[1] - 16,
      lineBreak: false,
    });

  // Type
  const typeLabel = tx.type === "credit" ? "Ingreso" : "Egreso";
  const typeColor = tx.type === "credit" ? COLORS.successDark : COLORS.dangerDark;
  doc
    .fillColor(typeColor)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text(typeLabel, COL_X[2] + 8, y + 8.5, {
      width: COL_WIDTHS[2] - 12,
      lineBreak: false,
    });

  // Amount (right-aligned)
  const sign = tx.type === "credit" ? "+" : "−";
  const amountStr = `${sign} $${formatCurrencyAR(Math.abs(tx.amount))}`;
  doc
    .fillColor(typeColor)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(amountStr, COL_X[3] + 4, y + 8, {
      width: COL_WIDTHS[3] - 12,
      align: "right",
      lineBreak: false,
    });

  // Category pill
  const catKey = tx.userCategory ?? tx.aiCategory;
  const catMeta = CATEGORY_META[catKey] ?? CATEGORY_META.otros;
  // Render the pill, but truncate label to fit column width
  const catLabel = ellipsis(catMeta.label, 14);
  doc.font("Helvetica-Bold").fontSize(7);
  const catTextW = doc.widthOfString(catLabel);
  const pillW = Math.min(COL_WIDTHS[4] - 10, catTextW + 8);
  doc.roundedRect(COL_X[4] + 4, y + 7, pillW, 12, 6).fillColor(catMeta.bg).fill();
  doc
    .fillColor(catMeta.color)
    .font("Helvetica-Bold")
    .fontSize(7)
    .text(catLabel, COL_X[4] + 8, y + 9.5, {
      width: pillW - 8,
      lineBreak: false,
    });

  // Status pill
  const statMeta = STATUS_META[tx.matchStatus] ?? STATUS_META.unmatched;
  doc.font("Helvetica-Bold").fontSize(6.5);
  const statW = doc.widthOfString(statMeta.label) + 8;
  doc.roundedRect(COL_X[5] + 2, y + 7, statW, 12, 6).fillColor(statMeta.bg).fill();
  doc
    .fillColor(statMeta.color)
    .font("Helvetica-Bold")
    .fontSize(6.5)
    .text(statMeta.label, COL_X[5] + 6, y + 9.7, {
      width: statW - 8,
      lineBreak: false,
    });

  return y + rowH;
}

// ── Observations ─────────────────────────────────────────────────────────────

interface Observation {
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
}

const SEVERITY_META = {
  high: { color: COLORS.dangerDark, bg: COLORS.dangerLight, label: "Alta" },
  medium: { color: COLORS.warningDark, bg: COLORS.warningLight, label: "Media" },
  low: { color: COLORS.primaryDark, bg: COLORS.primaryLight, label: "Baja" },
};

function drawObservations(doc: Doc, y: number, obs: Observation[]): number {
  if (obs.length === 0) {
    doc
      .roundedRect(MARGIN_X, y, CONTENT_W, 56, 8)
      .fillColor(COLORS.successLight)
      .fill();
    doc
      .fillColor(COLORS.successDark)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Sin observaciones", MARGIN_X + 16, y + 16, { lineBreak: false });
    doc
      .fillColor(COLORS.successDark)
      .font("Helvetica")
      .fontSize(9)
      .text(
        "Todas las transacciones del extracto fueron procesadas correctamente.",
        MARGIN_X + 16,
        y + 32,
        { width: CONTENT_W - 32 },
      );
    return y + 70;
  }

  const max = Math.min(obs.length, 12);
  let cy = y;
  for (let i = 0; i < max; i++) {
    const o = obs[i];
    const sev = SEVERITY_META[o.severity];
    const itemH = 36;

    // Card with border
    doc
      .lineWidth(0.6)
      .roundedRect(MARGIN_X, cy, CONTENT_W, itemH, 5)
      .fillAndStroke("#FFFFFF", COLORS.border);

    // Left accent (overdrawn on top)
    doc.rect(MARGIN_X, cy, 3, itemH).fill(sev.color);

    // Severity pill (top right)
    drawPill(doc, MARGIN_X + 12, cy + 7, sev.label, sev.bg, sev.color, { fontSize: 7, padX: 6, padY: 2 });

    // Title (after pill)
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(COLORS.subtle);
    const sevPillW = doc.widthOfString(sev.label) + 12;
    doc
      .fillColor(COLORS.ink)
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text(o.title, MARGIN_X + 14 + sevPillW + 8, cy + 8, {
        width: CONTENT_W - 30 - sevPillW,
        lineBreak: false,
      });

    // Detail
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(8.5)
      .text(o.detail, MARGIN_X + 14, cy + 21, {
        width: CONTENT_W - 28,
        lineBreak: false,
      });

    cy += itemH + 4;
  }

  if (obs.length > max) {
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica-Oblique")
      .fontSize(8.5)
      .text(`+ ${obs.length - max} observaciones adicionales en el reporte completo (Excel)`, MARGIN_X, cy + 4, {
        width: CONTENT_W,
      });
    cy += 18;
  }

  return cy;
}

// ── Footer ───────────────────────────────────────────────────────────────────

function drawFooter(doc: Doc, page: number, totalPages: number, orgName: string) {
  const fy = PAGE_H - 28;
  doc.strokeColor(COLORS.border).lineWidth(0.5).moveTo(MARGIN_X, fy).lineTo(PAGE_W - MARGIN_X, fy).stroke();

  doc
    .fillColor(COLORS.subtle)
    .font("Helvetica")
    .fontSize(8)
    .text(`${orgName} · Generado por FlowForge`, MARGIN_X, fy + 7, {
      width: CONTENT_W / 2,
      lineBreak: false,
    });

  const pageStr = `Página ${page} de ${totalPages}`;
  doc.text(pageStr, PAGE_W - MARGIN_X - doc.widthOfString(pageStr), fy + 7, { lineBreak: false });
}

// ── Page break helper ────────────────────────────────────────────────────────

function ensureSpace(doc: Doc, y: number, needed: number, reportType: ReportData["reportType"]): number {
  if (y + needed > PAGE_H - MARGIN_BOTTOM) {
    doc.addPage();
    drawRunningHeader(doc, reportType);
    return 50;
  }
  return y;
}

// ── Build observations ───────────────────────────────────────────────────────

function buildObservations(
  txs: TableTx[],
  matches: Array<{ matchType: string; status: string; confidenceScore: number; transactionId: string; invoiceId: string }>,
  overdueInvoices: Array<{ counterpartyName: string; invoiceNumber: string; totalAmount: number }>,
  txMap: Map<string, TableTx>,
  invoiceMap: Map<string, { totalAmount: number; counterpartyName: string }>,
): Observation[] {
  const obs: Observation[] = [];

  const NON_INVOICED = new Set([
    "transferencia_interna", "comision_bancaria", "retencion",
    "percepcion", "iva", "impuesto",
  ]);

  // Egresos sin match (high)
  const unmatchedDebits = txs.filter(
    (t) => t.matchStatus === "unmatched" && t.type === "debit" && !NON_INVOICED.has(t.aiCategory),
  );
  for (const tx of unmatchedDebits.slice(0, 8)) {
    obs.push({
      severity: "high",
      title: "Egreso sin factura asociada",
      detail: `${ellipsis(tx.description, 80)} · $${formatCurrencyAR(Math.abs(tx.amount))}`,
    });
  }

  // Ingresos sin match (medium)
  const unmatchedCredits = txs.filter((t) => t.matchStatus === "unmatched" && t.type === "credit");
  for (const tx of unmatchedCredits.slice(0, 5)) {
    obs.push({
      severity: "medium",
      title: "Ingreso sin factura asociada",
      detail: `${ellipsis(tx.description, 80)} · $${formatCurrencyAR(Math.abs(tx.amount))}`,
    });
  }

  // Facturas vencidas (high)
  for (const inv of overdueInvoices.slice(0, 6)) {
    obs.push({
      severity: "high",
      title: "Factura vencida sin pago",
      detail: `${inv.counterpartyName} · ${inv.invoiceNumber} · $${formatCurrencyAR(Math.abs(inv.totalAmount))}`,
    });
  }

  // Matches parciales (low)
  const partials = matches.filter((m) => m.matchType === "partial" && m.status === "suggested");
  for (const m of partials.slice(0, 5)) {
    const tx = txMap.get(m.transactionId);
    const inv = invoiceMap.get(m.invoiceId);
    if (!tx || !inv) continue;
    const diff = Math.abs(Math.abs(tx.amount) - inv.totalAmount);
    obs.push({
      severity: "low",
      title: "Match parcial — diferencia de monto",
      detail: `${inv.counterpartyName} · Diferencia $${formatCurrencyAR(diff)} · Confianza ${Math.round(m.confidenceScore * 100)}%`,
    });
  }

  return obs;
}

// ── Main PDF generation ──────────────────────────────────────────────────────

async function generatePDFBuffer(data: ReportData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_X, right: MARGIN_X },
        bufferPages: true,
        info: {
          Title: REPORT_TITLE[data.reportType],
          Author: "FlowForge",
          Creator: "FlowForge",
          Subject: data.period,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ── Load data ──────────────────────────────────────────────────
      const statement = await db.bankStatement.findUnique({
        where: { id: data.statementId },
        include: {
          bankAccount: { select: { bankName: true, accountNumber: true, currency: true } },
          transactions: { orderBy: { transactionDate: "asc" } },
        },
      });

      const org = await db.organization.findUnique({ where: { id: data.orgId } });

      const matches = await db.reconciliationMatch.findMany({
        where: { statementId: data.statementId },
        include: { invoice: { select: { id: true, totalAmount: true, counterpartyName: true } } },
      });

      const overdueInvoices = await db.invoice.findMany({
        where: { orgId: data.orgId, status: "overdue" },
        select: { counterpartyName: true, invoiceNumber: true, totalAmount: true },
      });

      const allTxs: TableTx[] = (statement?.transactions ?? []).map((t) => ({
        transactionDate: t.transactionDate,
        description: t.description,
        amount: Number(t.amount),
        type: t.type as "credit" | "debit",
        aiCategory: t.aiCategory,
        userCategory: t.userCategory,
        matchStatus: t.matchStatus as TableTx["matchStatus"],
      }));

      // Filter for tax_detail report
      const txs =
        data.reportType === "tax_detail"
          ? allTxs.filter((t) =>
              ["iva", "retencion", "percepcion", "impuesto", "comision_bancaria"].includes(
                t.aiCategory,
              ),
            )
          : allTxs;

      // ── Compute aggregates ─────────────────────────────────────────
      const credits = txs.filter((t) => t.type === "credit").reduce((s, t) => s + Math.abs(t.amount), 0);
      const debits = txs.filter((t) => t.type === "debit").reduce((s, t) => s + Math.abs(t.amount), 0);
      const balance = credits - debits;
      const matchedCount = txs.filter((t) => t.matchStatus === "confirmed").length;
      const suggestedCount = txs.filter((t) => t.matchStatus === "suggested").length;
      const unmatchedCount = txs.filter((t) => t.matchStatus === "unmatched").length;

      const taxTotal = txs
        .filter((t) => ["iva", "retencion", "percepcion", "impuesto"].includes(t.aiCategory))
        .reduce((s, t) => s + Math.abs(t.amount), 0);

      // Category aggregation
      const catMap = new Map<string, { total: number; count: number }>();
      for (const t of txs) {
        const k = t.userCategory ?? t.aiCategory;
        const cur = catMap.get(k) ?? { total: 0, count: 0 };
        cur.total += Math.abs(t.amount);
        cur.count += 1;
        catMap.set(k, cur);
      }
      const categories: CategoryAgg[] = Array.from(catMap.entries())
        .map(([category, v]) => ({ category, total: v.total, count: v.count }))
        .sort((a, b) => b.total - a.total);

      const grandTotal = categories.reduce((s, c) => s + c.total, 0);

      // Invoice/tx maps for observations
      const txMap = new Map<string, TableTx>();
      (statement?.transactions ?? []).forEach((t) => {
        txMap.set(t.id, {
          transactionDate: t.transactionDate,
          description: t.description,
          amount: Number(t.amount),
          type: t.type as "credit" | "debit",
          aiCategory: t.aiCategory,
          userCategory: t.userCategory,
          matchStatus: t.matchStatus as TableTx["matchStatus"],
        });
      });
      const invoiceMap = new Map<string, { totalAmount: number; counterpartyName: string }>();
      matches.forEach((m) => {
        if (m.invoice) {
          invoiceMap.set(m.invoiceId, {
            totalAmount: Number(m.invoice.totalAmount),
            counterpartyName: m.invoice.counterpartyName,
          });
        }
      });

      const observations = buildObservations(
        txs,
        matches.map((m) => ({
          matchType: m.matchType,
          status: m.status,
          confidenceScore: m.confidenceScore,
          transactionId: m.transactionId,
          invoiceId: m.invoiceId,
        })),
        overdueInvoices.map((i) => ({
          counterpartyName: i.counterpartyName,
          invoiceNumber: i.invoiceNumber,
          totalAmount: Number(i.totalAmount),
        })),
        txMap,
        invoiceMap,
      );

      // ── Render: cover page ─────────────────────────────────────────
      let y = drawCoverHeader(
        doc,
        data.reportType,
        org ? { name: org.name, cuit: org.cuit, fiscalCategory: org.fiscalCategory } : null,
        statement
          ? {
              bankName: statement.bankAccount.bankName,
              accountNumber: statement.bankAccount.accountNumber,
              periodStart: statement.periodStart,
              periodEnd: statement.periodEnd,
              closingBalance: Number(statement.closingBalance),
            }
          : null,
      );

      // ── KPIs ───────────────────────────────────────────────────────
      y = drawSectionTitle(doc, y, "Indicadores clave", "Vista rápida del período analizado");

      let kpis: Kpi[];
      if (data.reportType === "tax_detail") {
        kpis = [
          { label: "Total impuestos pagados", value: `$${formatCurrencyAR(taxTotal)}`, accent: COLORS.danger },
          {
            label: "IVA",
            value: `$${formatCurrencyAR(txs.filter((t) => t.aiCategory === "iva").reduce((s, t) => s + Math.abs(t.amount), 0))}`,
            accent: COLORS.warning,
          },
          {
            label: "Retenciones",
            value: `$${formatCurrencyAR(txs.filter((t) => t.aiCategory === "retencion").reduce((s, t) => s + Math.abs(t.amount), 0))}`,
            accent: COLORS.primary,
          },
          {
            label: "Percepciones IIBB",
            value: `$${formatCurrencyAR(txs.filter((t) => t.aiCategory === "percepcion").reduce((s, t) => s + Math.abs(t.amount), 0))}`,
            accent: COLORS.ai,
          },
          {
            label: "Comisiones bancarias",
            value: `$${formatCurrencyAR(txs.filter((t) => t.aiCategory === "comision_bancaria").reduce((s, t) => s + Math.abs(t.amount), 0))}`,
            accent: COLORS.muted,
          },
          {
            label: "Movimientos impositivos",
            value: txs.length.toString(),
            accent: COLORS.successDark,
          },
        ];
      } else {
        kpis = [
          { label: "Total ingresos", value: `$${formatCurrencyAR(credits)}`, accent: COLORS.success, hint: `${txs.filter((t) => t.type === "credit").length} movimientos` },
          { label: "Total egresos", value: `$${formatCurrencyAR(debits)}`, accent: COLORS.danger, hint: `${txs.filter((t) => t.type === "debit").length} movimientos` },
          { label: "Balance neto", value: `$${formatCurrencyAR(balance)}`, accent: balance >= 0 ? COLORS.success : COLORS.danger, hint: balance >= 0 ? "Resultado positivo" : "Resultado negativo" },
          { label: "Movimientos", value: txs.length.toString(), accent: COLORS.primary, hint: `Procesados por la IA` },
          { label: "Conciliados", value: matchedCount.toString(), accent: COLORS.success, hint: `${suggestedCount} pendientes` },
          { label: "Sin match", value: unmatchedCount.toString(), accent: unmatchedCount > 0 ? COLORS.warning : COLORS.muted, hint: unmatchedCount > 0 ? "Requiere revisión" : "Todo procesado" },
        ];
      }

      y = drawKpiGrid(doc, y, kpis) + 12;

      // ── Category breakdown ─────────────────────────────────────────
      if (categories.length > 0) {
        y = ensureSpace(doc, y, 220, data.reportType);
        y = drawSectionTitle(doc, y, "Distribución por categoría", "Top categorías ordenadas por monto total");
        y = drawCategoryChart(doc, y, categories, grandTotal) + 16;
      }

      // ── Observations ───────────────────────────────────────────────
      y = ensureSpace(doc, y, 100, data.reportType);
      y = drawSectionTitle(doc, y, "Observaciones", "Items que requieren atención del equipo contable");
      y = drawObservations(doc, y, observations) + 16;

      // ── Transactions table (new page) ─────────────────────────────
      doc.addPage();
      drawRunningHeader(doc, data.reportType);
      y = 50;
      y = drawSectionTitle(
        doc,
        y,
        "Detalle de transacciones",
        `${txs.length} movimientos del período · Ordenados cronológicamente`,
      );

      y = drawTableHeader(doc, y);

      const rowH = 24;
      let rowIdx = 0;
      for (const tx of txs) {
        if (y + rowH > PAGE_H - MARGIN_BOTTOM) {
          doc.addPage();
          drawRunningHeader(doc, data.reportType);
          y = 50;
          y = drawTableHeader(doc, y);
        }
        y = drawTableRow(doc, y, tx, rowIdx % 2 === 1);
        rowIdx++;
      }

      // ── Footer on every page (now that we know the total) ─────────
      const orgName = org?.name ?? "FlowForge";
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        drawFooter(doc, i + 1, range.count, orgName);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// ── Excel generation (kept simple but with formatting) ───────────────────────

async function generateExcelBuffer(data: ReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FlowForge";
  workbook.created = new Date();

  const statement = await db.bankStatement.findUnique({
    where: { id: data.statementId },
    include: {
      bankAccount: { select: { bankName: true, currency: true } },
      transactions: { orderBy: { transactionDate: "asc" } },
    },
  });

  const org = await db.organization.findUnique({ where: { id: data.orgId } });

  // ── Summary sheet ───────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet("Resumen", {
    properties: { tabColor: { argb: "FF0EA5E9" } },
  });
  summarySheet.columns = [
    { header: "Campo", key: "field", width: 30 },
    { header: "Valor", key: "value", width: 40 },
  ];

  summarySheet.addRow(["Organización", org?.name || "N/A"]);
  summarySheet.addRow(["CUIT", org?.cuit || "N/A"]);
  summarySheet.addRow(["Banco", statement?.bankAccount.bankName || "N/A"]);
  summarySheet.addRow(["Período", data.period]);
  summarySheet.addRow(["Generado", format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })]);
  summarySheet.addRow([]);

  const transactions = statement?.transactions || [];
  const credits = transactions.filter((t) => t.type === "credit").reduce((sum, t) => sum + t.amount.toNumber(), 0);
  const debits = transactions.filter((t) => t.type === "debit").reduce((sum, t) => sum + Math.abs(t.amount.toNumber()), 0);
  const matched = transactions.filter((t) => t.matchStatus === "confirmed").length;
  const unmatched = transactions.filter((t) => t.matchStatus === "unmatched").length;
  const suggested = transactions.filter((t) => t.matchStatus === "suggested").length;

  summarySheet.addRow(["Total Ingresos", credits]);
  summarySheet.addRow(["Total Egresos", debits]);
  summarySheet.addRow(["Balance", credits - debits]);
  summarySheet.addRow(["Transacciones Totales", transactions.length]);
  summarySheet.addRow(["Conciliadas", matched]);
  summarySheet.addRow(["Pendientes", suggested]);
  summarySheet.addRow(["Sin conciliar", unmatched]);

  // Style
  summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0369A1" },
  };

  // ── Detail sheet ────────────────────────────────────────────────
  const detailSheet = workbook.addWorksheet("Detalle", {
    properties: { tabColor: { argb: "FF10B981" } },
  });
  detailSheet.columns = [
    { header: "Fecha", key: "date", width: 14 },
    { header: "Descripción", key: "description", width: 50 },
    { header: "Tipo", key: "type", width: 10 },
    { header: "Monto", key: "amount", width: 16 },
    { header: "Categoría AI", key: "aiCategory", width: 22 },
    { header: "Categoría Usuario", key: "userCategory", width: 22 },
    { header: "Estado", key: "status", width: 14 },
    { header: "Confianza AI", key: "confidence", width: 14 },
  ];

  for (const tx of transactions) {
    const row = detailSheet.addRow({
      date: format(tx.transactionDate, "dd/MM/yyyy"),
      description: tx.description,
      type: tx.type === "credit" ? "Ingreso" : "Egreso",
      amount: tx.amount.toNumber(),
      aiCategory: tx.aiCategory,
      userCategory: tx.userCategory || "",
      status: tx.matchStatus,
      confidence: tx.aiConfidence,
    });
    // Color amount column
    const amountCell = row.getCell("amount");
    amountCell.numFmt = '"$"#,##0.00;[Red]"-$"#,##0.00';
    amountCell.font = { bold: true, color: { argb: tx.type === "credit" ? "FF047857" : "FFB91C1C" } };
  }

  // Header style
  [summarySheet, detailSheet].forEach((sheet) => {
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0369A1" },
    };
    header.height = 22;
    header.alignment = { vertical: "middle" };
  });

  // Freeze header rows
  detailSheet.views = [{ state: "frozen", ySplit: 1 }];

  const arr = await workbook.xlsx.writeBuffer();
  return Buffer.from(arr as ArrayBuffer);
}
