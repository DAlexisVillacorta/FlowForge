"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Scale,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import type { GeneratedReport, ReportType } from "./types";

// ── Tabs ──────────────────────────────────────────────────────────────────────

type PreviewTab = "resumen" | "detalle" | "observaciones";

const TABS: { id: PreviewTab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "detalle", label: "Detalle" },
  { id: "observaciones", label: "Observaciones" },
];

const REPORT_TITLES: Record<ReportType, string> = {
  conciliacion: "Reporte de Conciliación",
  resumen_mensual: "Resumen Mensual",
  detalle_impositivo: "Detalle Impositivo",
};

// ── Types of data fetched from /api/reports/[id] ─────────────────────────────

interface PreviewTransaction {
  id: string;
  transactionDate: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  aiCategory: string;
  userCategory: string | null;
  matchStatus: "unmatched" | "suggested" | "confirmed" | "rejected";
  matchedInvoiceId: string | null;
  invoice: {
    invoiceNumber: string;
    counterpartyName: string;
    totalAmount: number;
  } | null;
}

interface PreviewMatch {
  id: string;
  transactionId: string;
  invoiceId: string;
  confidenceScore: number;
  matchType: "exact" | "partial" | "grouped";
  status: string;
  invoice: {
    invoiceNumber: string;
    counterpartyName: string;
    totalAmount: number;
    type: string;
    dueDate: string;
  } | null;
  transaction: {
    id: string;
    amount: number;
    description: string;
  } | null;
}

interface PreviewInvoice {
  id: string;
  invoiceNumber: string;
  counterpartyName: string;
  totalAmount: number;
  dueDate: string;
  type: string;
  status: string;
}

interface PreviewData {
  report: {
    id: string;
    reportType: string;
    filePath: string | null;
    generatedAt: string;
    totals: {
      totalIncome: number;
      totalExpense: number;
      matched: number;
      unmatched: number;
      pendingReview: number;
    };
  };
  statement: {
    id: string;
    periodStart: string;
    periodEnd: string;
    closingBalance: number;
    transactionCount: number;
    matchedCount: number;
    bankName: string;
    currency: string;
  } | null;
  transactions: PreviewTransaction[];
  matches: PreviewMatch[];
  overdueInvoices: PreviewInvoice[];
}

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricMini({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  valueColor,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", iconBg)}>
          <Icon className={cn("h-3 w-3", iconColor)} />
        </div>
        <span className="text-[11px] font-medium text-neutral-500">{label}</span>
      </div>
      <p className={cn("font-mono text-lg font-bold", valueColor ?? "text-neutral-900")}>
        {value}
      </p>
    </div>
  );
}

// ── Resumen tab ───────────────────────────────────────────────────────────────

function ResumenTab({
  reportType,
  data,
}: {
  reportType: ReportType;
  data: PreviewData;
}) {
  const txs = data.transactions;
  const credits = txs.filter((t) => t.type === "credit").reduce((s, t) => s + Math.abs(t.amount), 0);
  const debits = txs.filter((t) => t.type === "debit").reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance = credits - debits;

  const confirmedTx = txs.filter((t) => t.matchStatus === "confirmed").length;
  const pendingTx = txs.filter((t) => t.matchStatus === "suggested").length;
  const unmatchedTx = txs.filter((t) => t.matchStatus === "unmatched").length;

  const taxTxs = txs.filter((t) =>
    ["iva", "retencion", "percepcion", "impuesto"].includes(t.aiCategory),
  );
  const taxTotal = taxTxs.reduce((s, t) => s + Math.abs(t.amount), 0);

  const period = data.statement
    ? new Date(data.statement.periodStart).toLocaleString("es-AR", {
        month: "long",
        year: "numeric",
      })
    : "—";

  const commonMetrics = [
    {
      icon: TrendingUp,
      iconBg: "bg-success-100",
      iconColor: "text-success-600",
      label: "Total ingresos",
      value: formatCurrency(credits),
      valueColor: "text-success-600",
    },
    {
      icon: TrendingDown,
      iconBg: "bg-danger-100",
      iconColor: "text-danger-600",
      label: "Total egresos",
      value: formatCurrency(debits),
      valueColor: "text-danger-600",
    },
    {
      icon: Scale,
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600",
      label: "Balance neto",
      value: formatCurrency(balance),
      valueColor: balance >= 0 ? "text-success-600" : "text-danger-600",
    },
    {
      icon: CheckCircle2,
      iconBg: "bg-neutral-100",
      iconColor: "text-neutral-600",
      label: "Transacciones",
      value: txs.length.toString(),
    },
    {
      icon: CheckCircle2,
      iconBg: "bg-success-100",
      iconColor: "text-success-600",
      label: "Matches confirmados",
      value: confirmedTx.toString(),
      valueColor: "text-success-600",
    },
    {
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      label: "Pendientes de revisión",
      value: pendingTx.toString(),
      valueColor: "text-amber-600",
    },
  ];

  const taxMetrics = [
    {
      icon: TrendingDown,
      iconBg: "bg-danger-100",
      iconColor: "text-danger-600",
      label: "Total impuestos pagados",
      value: formatCurrency(taxTotal),
      valueColor: "text-danger-600",
    },
    {
      icon: TrendingDown,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      label: "IVA",
      value: formatCurrency(
        txs.filter((t) => t.aiCategory === "iva").reduce((s, t) => s + Math.abs(t.amount), 0),
      ),
    },
    {
      icon: TrendingDown,
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600",
      label: "Retenciones",
      value: formatCurrency(
        txs.filter((t) => t.aiCategory === "retencion").reduce((s, t) => s + Math.abs(t.amount), 0),
      ),
    },
    {
      icon: TrendingDown,
      iconBg: "bg-neutral-100",
      iconColor: "text-neutral-600",
      label: "Percepciones IIBB",
      value: formatCurrency(
        txs.filter((t) => t.aiCategory === "percepcion").reduce((s, t) => s + Math.abs(t.amount), 0),
      ),
    },
    {
      icon: CheckCircle2,
      iconBg: "bg-neutral-100",
      iconColor: "text-neutral-600",
      label: "Movimientos impositivos",
      value: taxTxs.length.toString(),
    },
    {
      icon: Scale,
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600",
      label: "Período analizado",
      value: period.charAt(0).toUpperCase() + period.slice(1),
    },
  ];

  const summaryMetrics = [
    {
      icon: TrendingUp,
      iconBg: "bg-success-100",
      iconColor: "text-success-600",
      label: "Ingresos",
      value: formatCurrency(credits),
      valueColor: "text-success-600",
    },
    {
      icon: TrendingDown,
      iconBg: "bg-danger-100",
      iconColor: "text-danger-600",
      label: "Egresos",
      value: formatCurrency(debits),
      valueColor: "text-danger-600",
    },
    {
      icon: Scale,
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600",
      label: "Balance",
      value: formatCurrency(balance),
      valueColor: balance >= 0 ? "text-success-600" : "text-danger-600",
    },
    {
      icon: CheckCircle2,
      iconBg: "bg-neutral-100",
      iconColor: "text-neutral-600",
      label: "Total movimientos",
      value: txs.length.toString(),
    },
    {
      icon: AlertCircle,
      iconBg: "bg-danger-100",
      iconColor: "text-danger-600",
      label: "Sin conciliar",
      value: unmatchedTx.toString(),
      valueColor: unmatchedTx > 0 ? "text-danger-600" : "text-neutral-900",
    },
    {
      icon: Scale,
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600",
      label: "Período",
      value: period.charAt(0).toUpperCase() + period.slice(1),
    },
  ];

  const metrics =
    reportType === "detalle_impositivo"
      ? taxMetrics
      : reportType === "resumen_mensual"
        ? summaryMetrics
        : commonMetrics;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {metrics.map((m, i) => (
        <MetricMini key={i} {...m} />
      ))}
    </div>
  );
}

// ── Detalle tab ───────────────────────────────────────────────────────────────

function DetalleTab({
  reportType,
  data,
}: {
  reportType: ReportType;
  data: PreviewData;
}) {
  const allTxs = data.transactions;
  const txs = useMemo(() => {
    if (reportType === "detalle_impositivo") {
      return allTxs.filter((t) =>
        ["iva", "retencion", "percepcion", "impuesto", "comision_bancaria"].includes(
          t.aiCategory,
        ),
      );
    }
    return allTxs;
  }, [allTxs, reportType]);

  const VISIBLE_LIMIT = 100;
  const visibleTxs = txs.slice(0, VISIBLE_LIMIT);

  const statusLabel: Record<string, { label: string; cls: string }> = {
    confirmed: { label: "Confirmado", cls: "text-success-600 bg-success-50" },
    suggested: { label: "Sugerido", cls: "text-amber-600 bg-amber-50" },
    unmatched: { label: "Sin match", cls: "text-neutral-500 bg-neutral-100" },
    rejected: { label: "Rechazado", cls: "text-danger-600 bg-danger-50" },
  };

  if (txs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-400">
        Sin transacciones que coincidan con este reporte.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs text-neutral-400">
        Mostrando {visibleTxs.length} de {txs.length} transacciones
        {txs.length > VISIBLE_LIMIT && (
          <>
            {" · "}
            <span className="text-neutral-500">
              Descargá el reporte completo para ver todas
            </span>
          </>
        )}
      </p>
      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              {["Fecha", "Descripción", "Monto", "Categoría", "Estado"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide text-neutral-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {visibleTxs.map((tx) => {
              const st = statusLabel[tx.matchStatus] ?? statusLabel.unmatched;
              return (
                <tr key={tx.id} className="hover:bg-neutral-50/50">
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-neutral-400">
                    {formatDate(new Date(tx.transactionDate))}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2.5 text-neutral-700">
                    {tx.description}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 font-mono font-semibold",
                      tx.type === "credit" ? "text-success-600" : "text-danger-600",
                    )}
                  >
                    {tx.type === "credit" ? "+" : "−"}
                    {formatCurrency(Math.abs(tx.amount))}
                  </td>
                  <td className="px-3 py-2.5">
                    <CategoryBadge
                      category={(tx.userCategory ?? tx.aiCategory) as Parameters<typeof CategoryBadge>[0]["category"]}
                      size="sm"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        st.cls,
                      )}
                    >
                      {st.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Observaciones tab ────────────────────────────────────────────────────────

function ObservacionesTab({ data }: { data: PreviewData }) {
  const txs = data.transactions;

  type ObsItem = {
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    title: string;
    detail: string;
    severity: "high" | "medium" | "low";
  };

  const items: ObsItem[] = [];

  // Unmatched debits (most important — money going out without invoice support)
  const unmatchedDebits = txs.filter(
    (t) =>
      t.matchStatus === "unmatched" &&
      t.type === "debit" &&
      !["transferencia_interna", "comision_bancaria", "retencion", "percepcion", "iva", "impuesto"].includes(
        t.aiCategory,
      ),
  );
  for (const tx of unmatchedDebits.slice(0, 20)) {
    items.push({
      icon: AlertCircle,
      iconBg: "bg-danger-50",
      iconColor: "text-danger-600",
      title: "Egreso sin factura asociada",
      detail: `${tx.description.slice(0, 80)} — ${formatCurrency(Math.abs(tx.amount))}`,
      severity: "high",
    });
  }

  // Unmatched credits — income without invoice
  const unmatchedCredits = txs.filter(
    (t) => t.matchStatus === "unmatched" && t.type === "credit",
  );
  for (const tx of unmatchedCredits.slice(0, 10)) {
    items.push({
      icon: AlertCircle,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      title: "Ingreso sin factura asociada",
      detail: `${tx.description.slice(0, 80)} — ${formatCurrency(Math.abs(tx.amount))}`,
      severity: "medium",
    });
  }

  // Pending tax movements (suggested but unconfirmed for tax-related categories)
  const pendingTaxes = txs.filter(
    (t) =>
      t.matchStatus === "suggested" &&
      ["iva", "retencion", "percepcion", "impuesto"].includes(t.aiCategory),
  );
  for (const tx of pendingTaxes.slice(0, 10)) {
    items.push({
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      title: "Movimiento impositivo pendiente de confirmación",
      detail: `${tx.description.slice(0, 80)} — ${formatCurrency(Math.abs(tx.amount))}`,
      severity: "medium",
    });
  }

  // Overdue invoices in the org
  for (const inv of data.overdueInvoices) {
    items.push({
      icon: AlertTriangle,
      iconBg: "bg-danger-50",
      iconColor: "text-danger-600",
      title: "Factura vencida sin pago",
      detail: `${inv.counterpartyName} · ${inv.invoiceNumber} — ${formatCurrency(Math.abs(inv.totalAmount))}`,
      severity: "high",
    });
  }

  // Partial matches (amount mismatch)
  const partialMatches = data.matches.filter(
    (m) => m.matchType === "partial" && m.status === "suggested",
  );
  for (const m of partialMatches.slice(0, 10)) {
    if (!m.transaction || !m.invoice) continue;
    const diff = Math.abs(Math.abs(m.transaction.amount) - m.invoice.totalAmount);
    items.push({
      icon: Scale,
      iconBg: "bg-primary-50",
      iconColor: "text-primary-600",
      title: "Match parcial — diferencia de monto",
      detail: `${m.invoice.counterpartyName} · Diferencia ${formatCurrency(diff)} · Confianza ${Math.round(m.confidenceScore * 100)}%`,
      severity: "low",
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <CheckCircle2 className="mb-2 h-8 w-8 text-success-500" />
        <p className="text-sm font-semibold text-success-700">Sin observaciones</p>
        <p className="mt-1 text-xs text-neutral-400">
          Todo está en orden en este reporte.
        </p>
      </div>
    );
  }

  const severityLabel = {
    high: { label: "Alta", cls: "bg-danger-100 text-danger-700" },
    medium: { label: "Media", cls: "bg-amber-100 text-amber-700" },
    low: { label: "Baja", cls: "bg-primary-100 text-primary-700" },
  };

  return (
    <div className="space-y-2">
      <p className="mb-3 text-xs text-neutral-400">
        {items.length} item{items.length !== 1 ? "s" : ""} que requieren atención
      </p>
      {items.map((item, i) => {
        const Icon = item.icon;
        const sv = severityLabel[item.severity];
        return (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-white p-3.5"
          >
            <div
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                item.iconBg,
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", item.iconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-neutral-800">{item.title}</p>
                <span
                  className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", sv.cls)}
                >
                  {sv.label}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-neutral-500">
                {item.detail}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Observation count for the tab badge ────────────────────────────────────

function countObservations(data: PreviewData): number {
  const txs = data.transactions;
  const unmatchedDebits = txs.filter(
    (t) =>
      t.matchStatus === "unmatched" &&
      t.type === "debit" &&
      !["transferencia_interna", "comision_bancaria", "retencion", "percepcion", "iva", "impuesto"].includes(
        t.aiCategory,
      ),
  ).length;
  const unmatchedCredits = txs.filter((t) => t.matchStatus === "unmatched" && t.type === "credit").length;
  const pendingTaxes = txs.filter(
    (t) =>
      t.matchStatus === "suggested" &&
      ["iva", "retencion", "percepcion", "impuesto"].includes(t.aiCategory),
  ).length;
  const overdue = data.overdueInvoices.length;
  const partials = data.matches.filter(
    (m) => m.matchType === "partial" && m.status === "suggested",
  ).length;
  return Math.min(unmatchedDebits, 20) + Math.min(unmatchedCredits, 10) + Math.min(pendingTaxes, 10) + overdue + Math.min(partials, 10);
}

// ── ReportPreviewModal ────────────────────────────────────────────────────────

interface ReportPreviewModalProps {
  report: GeneratedReport | null;
  isOpen: boolean;
  onClose: () => void;
}

async function downloadReport(reportId: string, fallbackName: string) {
  try {
    const res = await fetch(`/api/reports/${reportId}/download`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Error al descargar");
    }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "";
    const filenameMatch = cd.match(/filename="?([^"]+)"?/);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filenameMatch?.[1] ?? fallbackName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al descargar el reporte";
    toast.error(msg);
  }
}

export function ReportPreviewModal({
  report,
  isOpen,
  onClose,
}: ReportPreviewModalProps) {
  const [tab, setTab] = useState<PreviewTab>("resumen");
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Fetch real data when the modal opens
  useEffect(() => {
    if (!isOpen || !report) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setTab("resumen");
    fetch(`/api/reports/${report.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("No se pudo cargar el reporte");
        return r.json();
      })
      .then((d: PreviewData) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : "Error desconocido"))
      .finally(() => setLoading(false));
  }, [isOpen, report]);

  if (!report) return null;

  const obsCount = data ? countObservations(data) : 0;
  const fallbackExt = report.format === "excel" ? "xlsx" : "pdf";
  const fallbackName = `FlowForge_${report.type}.${fallbackExt}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        title={REPORT_TITLES[report.type]}
        description={`${report.period} · ${report.format === "excel" ? "Excel" : "PDF"}`}
        onClose={onClose}
      />

      {/* Tabs */}
      <div className="border-b border-neutral-100 px-6">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                tab === t.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700",
              )}
            >
              {t.label}
              {t.id === "observaciones" && data && obsCount > 0 && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  {obsCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <ModalBody className="max-h-[420px] overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-neutral-500">Cargando datos del reporte…</span>
          </div>
        )}
        {!loading && error && (
          <div className="flex flex-col items-center py-12 text-center">
            <AlertTriangle className="mb-2 h-8 w-8 text-danger-500" />
            <p className="text-sm font-semibold text-danger-700">{error}</p>
          </div>
        )}
        {!loading && data && (
          <>
            {tab === "resumen" && <ResumenTab reportType={report.type} data={data} />}
            {tab === "detalle" && <DetalleTab reportType={report.type} data={data} />}
            {tab === "observaciones" && <ObservacionesTab data={data} />}
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="rounded-input px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
        >
          Cerrar
        </button>
        <button
          onClick={async () => {
            setDownloading(true);
            await downloadReport(report.id, fallbackName.replace(/\.[a-z]+$/, ".pdf"));
            setDownloading(false);
          }}
          disabled={downloading || !data?.report.filePath}
          title={!data?.report.filePath ? "El archivo no está disponible" : ""}
          className="flex items-center gap-1.5 rounded-input border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 text-danger-500" />
          )}
          Descargar
        </button>
      </ModalFooter>
    </Modal>
  );
}
