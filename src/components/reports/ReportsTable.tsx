"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  GitMerge,
  BarChart3,
  Landmark,
  FileSpreadsheet,
  FileText,
  Download,
  Trash2,
  FileSearch,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeneratedReport, ReportType, ReportFormat } from "./types";

// ── Config ────────────────────────────────────────────────────────────────────

const REPORT_TYPE_CONFIG: Record<
  ReportType,
  { label: string; icon: React.ElementType; bg: string; text: string; border: string }
> = {
  conciliacion: {
    label: "Conciliación",
    icon: GitMerge,
    bg: "bg-primary-50",
    text: "text-primary-700",
    border: "border-primary-200",
  },
  resumen_mensual: {
    label: "Resumen mensual",
    icon: BarChart3,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  detalle_impositivo: {
    label: "Det. impositivo",
    icon: Landmark,
    bg: "bg-danger-50",
    text: "text-danger-700",
    border: "border-danger-200",
  },
};

const FORMAT_CONFIG: Record<
  ReportFormat,
  { label: string; icon: React.ElementType; bg: string; text: string }
> = {
  excel: {
    label: "Excel",
    icon: FileSpreadsheet,
    bg: "bg-success-50",
    text: "text-success-700",
  },
  pdf: {
    label: "PDF",
    icon: FileText,
    bg: "bg-danger-50",
    text: "text-danger-700",
  },
};

// ── Time ago ──────────────────────────────────────────────────────────────────

const REF_DATE = new Date("2026-03-30T12:00:00");

function timeAgo(date: Date): string {
  const diffMs = REF_DATE.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  const hours = Math.floor(diffMins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}

// ── Type badge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: ReportType }) {
  const cfg = REPORT_TYPE_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        cfg.bg,
        cfg.text,
        cfg.border,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

// ── Format badge ──────────────────────────────────────────────────────────────

function FormatBadge({ format }: { format: ReportFormat }) {
  const cfg = FORMAT_CONFIG[format];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold",
        cfg.bg,
        cfg.text,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
        <ClipboardList className="h-7 w-7 text-neutral-400" />
      </div>
      <p className="text-sm font-semibold text-neutral-600">
        Todavía no generaste ningún reporte
      </p>
      <p className="mt-1.5 max-w-xs text-xs text-neutral-400">
        Elegí un tipo de reporte arriba y hacé clic en{" "}
        <span className="font-medium text-neutral-500">&ldquo;Generar reporte&rdquo;</span>{" "}
        para empezar.
      </p>
    </motion.div>
  );
}

// ── ReportsTable ──────────────────────────────────────────────────────────────

interface ReportsTableProps {
  reports: GeneratedReport[];
  onPreview: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ReportsTable({ reports, onPreview, onDelete }: ReportsTableProps) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <FileSearch className="h-4 w-4 text-neutral-400" />
        <h2 className="font-heading text-base font-bold text-neutral-900">
          Reportes generados
        </h2>
        {reports.length > 0 && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500">
            {reports.length}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-subtle">
        {reports.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Table header */}
            <div className="hidden grid-cols-[180px_1fr_80px_120px_auto] gap-4 border-b border-neutral-100 px-5 py-3 lg:grid">
              {["Tipo", "Período", "Formato", "Generado", "Acciones"].map(
                (h) => (
                  <span
                    key={h}
                    className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400"
                  >
                    {h}
                  </span>
                ),
              )}
            </div>

            {/* Rows */}
            <div className="divide-y divide-neutral-100">
              <AnimatePresence initial={false}>
                {reports.map((report, i) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 16, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                  >
                    {/* Desktop row */}
                    <div className="hidden grid-cols-[180px_1fr_80px_120px_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-neutral-50/60 lg:grid">
                      <TypeBadge type={report.type} />
                      <span className="text-sm text-neutral-700">
                        {report.period}
                      </span>
                      <FormatBadge format={report.format} />
                      <span className="text-xs text-neutral-400">
                        {timeAgo(report.generatedAt)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onPreview(report.id)}
                          className="flex items-center gap-1.5 rounded-input border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-100"
                        >
                          <FileSearch className="h-3 w-3" />
                          Ver
                        </button>
                        <button
                          onClick={() => {}}
                          className="flex items-center gap-1.5 rounded-input border border-success-300 bg-success-50 px-3 py-1.5 text-xs font-semibold text-success-600 transition-colors hover:bg-success-100"
                        >
                          <Download className="h-3 w-3" />
                          Descargar
                        </button>
                        <button
                          onClick={() => onDelete(report.id)}
                          className="rounded-input border border-transparent p-1.5 text-neutral-400 transition-colors hover:border-danger-200 hover:bg-danger-50 hover:text-danger-600"
                          title="Eliminar reporte"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile row */}
                    <div className="flex items-start justify-between gap-3 px-4 py-3.5 lg:hidden">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <TypeBadge type={report.type} />
                          <FormatBadge format={report.format} />
                        </div>
                        <p className="text-sm text-neutral-700">{report.period}</p>
                        <p className="mt-0.5 text-xs text-neutral-400">
                          {timeAgo(report.generatedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => onPreview(report.id)}
                          className="rounded-input border border-primary-200 bg-primary-50 p-2 text-primary-600"
                        >
                          <FileSearch className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(report.id)}
                          className="rounded-input border border-transparent p-2 text-neutral-400 hover:border-danger-200 hover:bg-danger-50 hover:text-danger-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
