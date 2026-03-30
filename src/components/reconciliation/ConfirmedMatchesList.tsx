"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  CheckCircle2,
  RotateCcw,
  ArrowRightLeft,
  Zap,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Transaction, Invoice, ReconciliationMatch } from "@/lib/types";

// ── Match type labels ─────────────────────────────────────────────────────────

const MATCH_TYPE_CONFIG: Record<
  ReconciliationMatch["matchType"],
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  exact: {
    label: "Exacto",
    icon: CheckCircle2,
    color: "text-success-600",
    bg: "bg-success-50",
  },
  partial: {
    label: "Parcial",
    icon: ArrowRightLeft,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  grouped: {
    label: "Agrupado",
    icon: Zap,
    color: "text-primary-600",
    bg: "bg-primary-50",
  },
};

// ── Confirmed item ────────────────────────────────────────────────────────────

function ConfirmedItem({
  match,
  tx,
  invoice,
  isSessionConfirmed,
  onUndo,
}: {
  match: ReconciliationMatch;
  tx: Transaction | undefined;
  invoice: Invoice | undefined;
  isSessionConfirmed: boolean;
  onUndo: () => void;
}) {
  const cfg = MATCH_TYPE_CONFIG[match.matchType];
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={isSessionConfirmed ? { opacity: 0, y: -8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-white px-3 py-2.5"
    >
      {/* Match type badge */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          cfg.bg,
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
      </div>

      {/* Tx description */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-xs font-medium text-neutral-800">
          {tx?.description ?? match.transactionId}
        </p>
        <p
          className={cn(
            "font-mono text-[11px] font-semibold",
            tx?.type === "credit" ? "text-success-600" : "text-danger-600",
          )}
        >
          {tx ? (tx.type === "credit" ? "+" : "−") + formatCurrency(Math.abs(tx.amount)) : "—"}
        </p>
      </div>

      {/* Arrow */}
      <ArrowRightLeft className="h-3 w-3 shrink-0 text-neutral-300" />

      {/* Invoice info */}
      <div className="min-w-0 w-36 shrink-0">
        <p className="line-clamp-1 text-[11px] font-medium text-neutral-700">
          {invoice?.counterpartyName ?? match.invoiceId}
        </p>
        <p className="font-mono text-[10px] text-neutral-400">
          {formatCurrency(invoice?.totalAmount ?? 0)}
        </p>
      </div>

      {/* Type pill */}
      <span
        className={cn(
          "hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:block",
          cfg.bg,
          cfg.color,
        )}
      >
        {cfg.label}
      </span>

      {/* Confidence */}
      <span className="hidden shrink-0 font-mono text-[10px] text-neutral-400 sm:block">
        {Math.round(match.confidenceScore * 100)}%
      </span>

      {/* Undo (only for session-confirmed) */}
      {isSessionConfirmed && (
        <button
          onClick={onUndo}
          title="Deshacer match"
          className="shrink-0 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}

// ── ConfirmedMatchesList ──────────────────────────────────────────────────────

interface ConfirmedMatchesListProps {
  matches: ReconciliationMatch[];
  sessionConfirmedIds: Set<string>;
  txMap: Record<string, Transaction | undefined>;
  invoiceMap: Record<string, Invoice | undefined>;
  onUndo: (matchId: string) => void;
}

export function ConfirmedMatchesList({
  matches,
  sessionConfirmedIds,
  txMap,
  invoiceMap,
  onUndo,
}: ConfirmedMatchesListProps) {
  const [expanded, setExpanded] = useState(false);

  if (matches.length === 0) return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-100">
            <CheckCircle2 className="h-3.5 w-3.5 text-success-600" />
          </div>
          <span className="text-sm font-semibold text-neutral-800">
            Matches confirmados
          </span>
          <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-bold text-success-700">
            {matches.length}
          </span>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        </motion.div>
      </button>

      {/* Collapsible list */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 border-t border-neutral-200 px-4 pb-4 pt-3">
              <AnimatePresence>
                {matches.map((m) => (
                  <ConfirmedItem
                    key={m.id}
                    match={m}
                    tx={txMap[m.transactionId]}
                    invoice={invoiceMap[m.invoiceId]}
                    isSessionConfirmed={sessionConfirmedIds.has(m.id)}
                    onUndo={() => onUndo(m.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
