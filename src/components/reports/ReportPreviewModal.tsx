"use client";

import { useMemo, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Scale,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { mockTransactions, mockMatches, mockInvoices } from "@/lib/mock-data";
import type { GeneratedReport, ReportType } from "./types";

// ── Tabs ──────────────────────────────────────────────────────────────────────

type PreviewTab = "resumen" | "detalle" | "observaciones";

const TABS: { id: PreviewTab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "detalle", label: "Detalle" },
  { id: "observaciones", label: "Observaciones" },
];

// ── Report type labels ────────────────────────────────────────────────────────

const REPORT_TITLES: Record<ReportType, string> = {
  conciliacion: "Reporte de Conciliación",
  resumen_mensual: "Resumen Mensual",
  detalle_impositivo: "Detalle Impositivo",
};

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
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md",
            iconBg,
          )}
        >
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

// ── Tabs content: Resumen ─────────────────────────────────────────────────────

function ResumenTab({ reportType }: { reportType: ReportType }) {
  const txs = useMemo(
    () => mockTransactions.filter((t) => t.statementId === "stmt-1"),
    [],
  );
  const credits = txs
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + t.amount, 0);
  const debits = txs
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance = credits - debits;

  const confirmedMatches = mockMatches.filter((m) => m.status === "confirmed").length;
  const pendingMatches = mockMatches.filter((m) => m.status === "suggested").length;

  const taxTxs = txs.filter((t) =>
    ["iva", "retencion", "percepcion", "impuesto"].includes(t.aiCategory),
  );
  const taxTotal = taxTxs.reduce((s, t) => s + Math.abs(t.amount), 0);

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
      value: confirmedMatches.toString(),
      valueColor: "text-success-600",
    },
    {
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      label: "Pendientes de revisión",
      value: pendingMatches.toString(),
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
      label: "IVA (ventas declarado)",
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
      value: "Mar 2026",
    },
  ];

  const metrics = reportType === "detalle_impositivo" ? taxMetrics : commonMetrics;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {metrics.map((m, i) => (
        <MetricMini key={i} {...m} />
      ))}
    </div>
  );
}

// ── Tabs content: Detalle ────────────────────────────────────────────────────

function DetalleTab({ reportType }: { reportType: ReportType }) {
  const txs = useMemo(() => {
    const all = mockTransactions.filter((t) => t.statementId === "stmt-1");
    if (reportType === "detalle_impositivo") {
      return all.filter((t) =>
        ["iva", "retencion", "percepcion", "impuesto", "comision_bancaria"].includes(
          t.aiCategory,
        ),
      );
    }
    return all;
  }, [reportType]);

  const statusLabel: Record<string, { label: string; cls: string }> = {
    confirmed: { label: "Confirmado", cls: "text-success-600 bg-success-50" },
    suggested: { label: "Sugerido", cls: "text-amber-600 bg-amber-50" },
    unmatched: { label: "Sin match", cls: "text-neutral-500 bg-neutral-100" },
    rejected: { label: "Rechazado", cls: "text-danger-600 bg-danger-50" },
  };

  return (
    <div>
      <p className="mb-3 text-xs text-neutral-400">
        Mostrando {txs.length} transacciones ·{" "}
        <span className="text-neutral-500">
          El reporte completo incluye todos los datos exportados
        </span>
      </p>
      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              {["Fecha", "Descripción", "Monto", "Categoría", "Estado"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide text-neutral-400"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {txs.map((tx) => {
              const st = statusLabel[tx.matchStatus] ?? statusLabel.unmatched;
              return (
                <tr key={tx.id} className="hover:bg-neutral-50/50">
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-neutral-400">
                    {formatDate(tx.transactionDate)}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2.5 text-neutral-700">
                    {tx.description}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 font-mono font-semibold",
                      tx.type === "credit"
                        ? "text-success-600"
                        : "text-danger-600",
                    )}
                  >
                    {tx.type === "credit" ? "+" : "−"}
                    {formatCurrency(Math.abs(tx.amount))}
                  </td>
                  <td className="px-3 py-2.5">
                    <CategoryBadge category={tx.aiCategory} size="sm" />
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

// ── Tabs content: Observaciones ───────────────────────────────────────────────

function ObservacionesTab() {
  const txs = mockTransactions.filter((t) => t.statementId === "stmt-1");
  const unmatched = txs.filter((t) => t.matchStatus === "unmatched");
  const suggested = txs.filter(
    (t) => t.matchStatus === "suggested" && !t.matchedInvoiceId,
  );
  const overdueInv = mockInvoices.filter((i) => i.status === "overdue");
  const pendingNC = mockInvoices.filter(
    (i) => i.type === "nota_credito" && i.status === "pending",
  );
  const partialMatches = mockMatches.filter(
    (m) => m.matchType === "partial" && m.status === "suggested",
  );

  type ObsItem = {
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    title: string;
    detail: string;
    severity: "high" | "medium" | "low";
  };

  const items: ObsItem[] = [
    ...unmatched.map((tx) => ({
      icon: AlertCircle,
      iconBg: "bg-danger-50",
      iconColor: "text-danger-600",
      title: "Transacción sin match",
      detail: `${tx.description.slice(0, 60)} — ${formatCurrency(Math.abs(tx.amount))}`,
      severity: "high" as const,
    })),
    ...suggested.map((tx) => ({
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      title: "Movimiento impositivo pendiente",
      detail: `${tx.description.slice(0, 60)} — ${formatCurrency(Math.abs(tx.amount))}`,
      severity: "medium" as const,
    })),
    ...overdueInv.map((inv) => ({
      icon: AlertTriangle,
      iconBg: "bg-danger-50",
      iconColor: "text-danger-600",
      title: "Factura vencida sin pago",
      detail: `${inv.counterpartyName} · ${inv.invoiceNumber} — ${formatCurrency(inv.totalAmount)}`,
      severity: "high" as const,
    })),
    ...pendingNC.map((inv) => ({
      icon: AlertCircle,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      title: "Nota de crédito pendiente de aplicar",
      detail: `${inv.counterpartyName} · ${inv.invoiceNumber} — ${formatCurrency(Math.abs(inv.totalAmount))}`,
      severity: "medium" as const,
    })),
    ...partialMatches.map((m) => {
      const tx = txs.find((t) => t.id === m.transactionId);
      const inv = mockInvoices.find((i) => i.id === m.invoiceId);
      const diff = tx && inv ? Math.abs(Math.abs(tx.amount) - inv.totalAmount) : 0;
      return {
        icon: Scale,
        iconBg: "bg-primary-50",
        iconColor: "text-primary-600",
        title: "Match parcial — diferencia de monto",
        detail: `Diferencia de ${formatCurrency(diff)} · Confianza ${Math.round(m.confidenceScore * 100)}%`,
        severity: "low" as const,
      };
    }),
  ];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <CheckCircle2 className="mb-2 h-8 w-8 text-success-500" />
        <p className="text-sm font-semibold text-success-700">
          Sin observaciones
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          Todo está en orden en este período.
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
        {items.length} item{items.length !== 1 ? "s" : ""} que requieren
        atención
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
                <p className="text-xs font-semibold text-neutral-800">
                  {item.title}
                </p>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    sv.cls,
                  )}
                >
                  {sv.label}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                {item.detail}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── ReportPreviewModal ────────────────────────────────────────────────────────

interface ReportPreviewModalProps {
  report: GeneratedReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportPreviewModal({
  report,
  isOpen,
  onClose,
}: ReportPreviewModalProps) {
  const [tab, setTab] = useState<PreviewTab>("resumen");

  if (!report) return null;

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
              {t.id === "observaciones" && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  {mockTransactions.filter(
                    (tx) => tx.matchStatus === "unmatched",
                  ).length +
                    mockInvoices.filter((i) => i.status === "overdue").length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <ModalBody className="max-h-[420px] overflow-y-auto">
        {tab === "resumen" && <ResumenTab reportType={report.type} />}
        {tab === "detalle" && <DetalleTab reportType={report.type} />}
        {tab === "observaciones" && <ObservacionesTab />}
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="rounded-input px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
        >
          Cerrar
        </button>
        <button
          onClick={() => {}}
          className="flex items-center gap-1.5 rounded-input border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          <FileText className="h-4 w-4 text-danger-500" />
          Descargar PDF
        </button>
        <button
          onClick={() => {}}
          className="flex items-center gap-1.5 rounded-input bg-success-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-success-700"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Descargar Excel
        </button>
      </ModalFooter>
    </Modal>
  );
}
