"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  GitMerge,
  BarChart3,
  Landmark,
  Loader2,
  FileSpreadsheet,
  FileText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportType, ReportFormat } from "./types";

// ── Config per report type ────────────────────────────────────────────────────

const CONFIG = {
  conciliacion: {
    title: "Reporte de conciliación",
    description: "Detalle completo de transacciones matcheadas y pendientes",
    icon: GitMerge,
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
    headerBg: "bg-gradient-to-br from-primary-50 to-white",
    border: "border-primary-200",
    btnBg: "bg-primary-600 hover:bg-primary-700",
    formats: ["excel", "pdf"] as ReportFormat[],
    hasStmtSelect: true,
    hasPeriodSelect: false,
  },
  resumen_mensual: {
    title: "Resumen mensual",
    description: "Ingresos, egresos y balance del período seleccionado",
    icon: BarChart3,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    headerBg: "bg-gradient-to-br from-amber-50 to-white",
    border: "border-amber-200",
    btnBg: "bg-amber-500 hover:bg-amber-600",
    formats: ["excel", "pdf"] as ReportFormat[],
    hasStmtSelect: false,
    hasPeriodSelect: true,
  },
  detalle_impositivo: {
    title: "Detalle impositivo",
    description: "IVA, retenciones y percepciones del período",
    icon: Landmark,
    iconBg: "bg-danger-100",
    iconColor: "text-danger-600",
    headerBg: "bg-gradient-to-br from-danger-50 to-white",
    border: "border-danger-200",
    btnBg: "bg-danger-600 hover:bg-danger-700",
    formats: ["excel"] as ReportFormat[],
    hasStmtSelect: false,
    hasPeriodSelect: true,
  },
} satisfies Record<ReportType, object>;

// ── Periods ───────────────────────────────────────────────────────────────────

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function generatePeriodsFromStatements(statements: Array<{ periodStart: string }>) {
  const periodSet = new Set<string>();
  statements.forEach(s => {
    const d = new Date(s.periodStart);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    periodSet.add(key);
  });
  return Array.from(periodSet)
    .sort((a, b) => b.localeCompare(a))
    .map(value => {
      const [year, month] = value.split('-');
      return { value, label: `${MONTHS[parseInt(month) - 1]} ${year}` };
    });
}

// ── Format selector ───────────────────────────────────────────────────────────

function FormatSelector({
  formats,
  selected,
  onChange,
}: {
  formats: ReportFormat[];
  selected: ReportFormat;
  onChange: (f: ReportFormat) => void;
}) {
  if (formats.length === 1) {
    return (
      <div className="flex items-center gap-1.5 rounded-input border border-neutral-200 bg-neutral-50 px-3 py-1.5">
        <FileSpreadsheet className="h-3.5 w-3.5 text-success-600" />
        <span className="text-xs font-medium text-neutral-600">
          Excel · preparado para importar
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 rounded-input border border-neutral-200 bg-neutral-50 p-0.5">
      {formats.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all",
            selected === f
              ? "bg-white text-neutral-800 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700",
          )}
        >
          {f === "excel" ? (
            <FileSpreadsheet className="h-3 w-3 text-success-600" />
          ) : (
            <FileText className="h-3 w-3 text-danger-500" />
          )}
          {f === "excel" ? "Excel" : "PDF"}
        </button>
      ))}
    </div>
  );
}

// ── ReportTypeCard ─────────────────────────────────────────────────────────────

interface ReportTypeCardProps {
  type: ReportType;
  delay?: number;
  onGenerate: (type: ReportType, period: string, format: ReportFormat, stmtId?: string) => void;
  statements: Array<{
    id: string;
    periodStart: string;
    bankAccount?: { bankName: string };
  }>;
}

function getStmtLabel(stmt: { periodStart: string; bankAccount?: { bankName: string } }): string {
  const d = new Date(stmt.periodStart);
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${stmt.bankAccount?.bankName ?? "Banco"} — ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function ReportTypeCard({ type, delay = 0, onGenerate, statements }: ReportTypeCardProps) {
  const cfg = CONFIG[type];
  const Icon = cfg.icon;

  const [format, setFormat] = useState<ReportFormat>(cfg.formats[0]);
  const [stmtId, setStmtId] = useState("");
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(false);

  const periods = generatePeriodsFromStatements(statements);

  const displayPeriod = cfg.hasStmtSelect
    ? (statements.find(s => s.id === stmtId) ? getStmtLabel(statements.find(s => s.id === stmtId)!) : "Seleccionar extracto")
    : (periods.find((p) => p.value === period)?.label ?? "Seleccionar período");

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerate(type, displayPeriod, format, cfg.hasStmtSelect ? stmtId : undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn(
        "flex flex-col rounded-xl border bg-white shadow-subtle transition-shadow hover:shadow-card",
        cfg.border,
      )}
    >
      {/* Card header */}
      <div className={cn("rounded-t-xl px-5 py-4", cfg.headerBg)}>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              cfg.iconBg,
            )}
          >
            <Icon className={cn("h-5 w-5", cfg.iconColor)} />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-neutral-900">
              {cfg.title}
            </h3>
            <div className="mt-0.5 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-ai-400" />
              <span className="text-[11px] text-ai-600">Generado con IA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-xs leading-relaxed text-neutral-500">
          {cfg.description}
        </p>

        {/* Statement selector */}
        {cfg.hasStmtSelect && (
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Extracto
            </label>
            <select
              value={stmtId}
              onChange={(e) => setStmtId(e.target.value)}
              className="h-8 w-full rounded-input border border-neutral-200 bg-white px-2.5 text-xs text-neutral-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15"
            >
              <option value="">Seleccionar extracto</option>
              {statements.map((s) => (
                <option key={s.id} value={s.id}>
                  {getStmtLabel(s)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Period selector */}
        {cfg.hasPeriodSelect && (
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Período
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-8 w-full rounded-input border border-neutral-200 bg-white px-2.5 text-xs text-neutral-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15"
            >
              <option value="">Seleccionar período</option>
              {periods.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Format selector */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            Formato
          </label>
          <FormatSelector
            formats={cfg.formats}
            selected={format}
            onChange={setFormat}
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={cn(
            "flex h-9 w-full items-center justify-center gap-2 rounded-input text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-80",
            cfg.btnBg,
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando…
            </>
          ) : (
            "Generar reporte"
          )}
        </button>
      </div>
    </motion.div>
  );
}
