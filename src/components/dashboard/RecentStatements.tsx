"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn, getStatusBadgeClasses } from "@/lib/utils";

function formatPeriod(start: Date): string {
  const raw = format(start, "MMMM yyyy", { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const statusLabels: Record<string, string> = {
  processing: "Procesando",
  classified: "Clasificado",
  reviewing: "En revisión",
  reconciled: "Conciliado",
  completed: "Completado",
};

interface StatementRowProps {
  bankName: string;
  period: string;
  statementId: string;
  status: string;
  matchedCount: number;
  transactionCount: number;
  index: number;
}

function StatementRow({
  bankName,
  period,
  statementId,
  status,
  matchedCount,
  transactionCount,
  index,
}: StatementRowProps) {
  const progressPct = transactionCount > 0 ? Math.round((matchedCount / transactionCount) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.35,
        delay: 0.18 + index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Link
        href={`/transactions?statement=${statementId}`}
        className="group flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-neutral-50 dark:hover:bg-white/[0.04]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/15">
          <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-slate-100">
              {bankName} — {period}
            </p>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                getStatusBadgeClasses(status),
              )}
            >
              {statusLabels[status] ?? status}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/[0.08]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{
                  duration: 0.7,
                  delay: 0.35 + index * 0.08,
                  ease: "easeOut",
                }}
                className={cn(
                  "h-full rounded-full",
                  progressPct === 100
                    ? "bg-success-500"
                    : progressPct >= 70
                      ? "bg-primary-500"
                      : "bg-amber-400",
                )}
              />
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-neutral-500 dark:text-slate-500">
              {matchedCount}/{transactionCount}
            </span>
          </div>
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-400 dark:text-slate-600 dark:group-hover:text-slate-400" />
      </Link>
    </motion.div>
  );
}

interface RecentStatementsProps {
  data?: Array<{
    id: string;
    bankAccount?: { bankName: string };
    periodStart: Date;
    status: string;
    matchedCount: number;
    transactionCount: number;
  }>;
}

export function RecentStatements({ data = [] }: RecentStatementsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-card border border-neutral-200 bg-white shadow-subtle dark:border-white/[0.07] dark:bg-[#161B27] dark:shadow-[0_4px_28px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-white/[0.05]">
        <div>
          <h2 className="font-heading text-base font-semibold text-neutral-900 dark:text-slate-100">
            Extractos recientes
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-slate-400">
            {data.length} extractos cargados
          </p>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Ver todos →
        </Link>
      </div>

      <div className="divide-y divide-neutral-50 px-2 py-2 dark:divide-white/[0.04]">
        {data.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-400 dark:text-slate-500">No hay extractos aún</p>
        ) : (
          data.map((stmt, i) => (
            <StatementRow
              key={stmt.id}
              bankName={stmt.bankAccount?.bankName ?? "Banco"}
              period={formatPeriod(stmt.periodStart)}
              statementId={stmt.id}
              status={stmt.status}
              matchedCount={stmt.matchedCount}
              transactionCount={stmt.transactionCount}
              index={i}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
