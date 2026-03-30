"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FileBarChart2, CheckCircle2, HelpCircle, AlertCircle, TrendingUp } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
  progress,
  delay,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  sub?: string;
  progress?: number; // 0–1
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-subtle"
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            iconBg,
          )}
        >
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
        <span className="text-xs font-medium text-neutral-500">{label}</span>
      </div>

      <div>
        <p className="font-heading text-2xl font-bold text-neutral-900">
          {value}
        </p>
        {sub && (
          <p className="mt-0.5 text-xs text-neutral-400">{sub}</p>
        )}
      </div>

      {progress !== undefined && (
        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <motion.div
            className="h-full rounded-full bg-success-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress * 100, 100)}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: delay + 0.15 }}
          />
        </div>
      )}
    </motion.div>
  );
}

// ── ReconciliationSummary ─────────────────────────────────────────────────────

interface ReconciliationSummaryProps {
  confirmedCount: number;
  totalMatchable: number;
  unmatchedTxCount: number;
  unmatchedInvCount: number;
  totalDifference: number;
}

export function ReconciliationSummary({
  confirmedCount,
  totalMatchable,
  unmatchedTxCount,
  unmatchedInvCount,
  totalDifference,
}: ReconciliationSummaryProps) {
  const router = useRouter();
  const progress = totalMatchable > 0 ? confirmedCount / totalMatchable : 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-base font-bold text-neutral-900">
            Resumen de conciliación
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Estado actual del período analizado
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          icon={CheckCircle2}
          iconBg="bg-success-50"
          iconColor="text-success-600"
          label="Matches confirmados"
          value={`${confirmedCount} / ${totalMatchable}`}
          sub={`${Math.round(progress * 100)}% del total`}
          progress={progress}
          delay={0}
        />
        <MetricCard
          icon={HelpCircle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="Sin match (movimientos)"
          value={unmatchedTxCount}
          sub="Requieren revisión manual"
          delay={0.05}
        />
        <MetricCard
          icon={AlertCircle}
          iconBg="bg-danger-50"
          iconColor="text-danger-600"
          label="Sin match (facturas)"
          value={unmatchedInvCount}
          sub="Facturas sin movimiento"
          delay={0.10}
        />
        <MetricCard
          icon={TrendingUp}
          iconBg="bg-primary-50"
          iconColor="text-primary-600"
          label="Diferencia total"
          value={formatCurrency(totalDifference)}
          sub={totalDifference === 0 ? "Sin diferencias" : "En matches parciales"}
          delay={0.15}
        />
      </div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        onClick={() => router.push("/reports")}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-700 hover:shadow-lg active:scale-[0.99]"
      >
        <FileBarChart2 className="h-4 w-4" />
        Generar reporte de conciliación
      </motion.button>
    </div>
  );
}
