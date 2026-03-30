"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Search,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Transaction, Invoice, ReconciliationMatch } from "@/lib/types";

// ── Match reason labels ────────────────────────────────────────────────────────

const MATCH_REASON: Record<ReconciliationMatch["matchType"], string> = {
  exact: "Coincidencia exacta de monto y proveedor",
  partial: "Coincidencia parcial — hay diferencia de monto",
  grouped: "Dos movimientos cubren el total de esta factura",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface MatchDetailCardProps {
  tx: Transaction | null;
  invoice: Invoice | null;
  match: ReconciliationMatch | null;
  isFlashing: boolean;
  onConfirm: () => void;
  onReject: () => void;
  onSearchOther: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MatchDetailCard({
  tx,
  invoice,
  match,
  isFlashing,
  onConfirm,
  onReject,
  onSearchOther,
}: MatchDetailCardProps) {
  const visible = !!(tx && match && invoice);
  const amountDiff =
    tx && invoice ? Math.abs(Math.abs(tx.amount) - invoice.totalAmount) : 0;
  const confidence = match?.confidenceScore ?? 0;
  const confidencePct = Math.round(confidence * 100);
  const confidenceColor =
    confidence >= 0.8
      ? "text-success-600"
      : confidence >= 0.65
        ? "text-amber-600"
        : "text-danger-600";
  const confidenceBg =
    confidence >= 0.8
      ? "bg-success-500"
      : confidence >= 0.65
        ? "bg-amber-400"
        : "bg-danger-500";

  // No match — tx selected but no suggested invoice
  const noMatchVisible = !!(tx && !match);

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key="card"
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={cn(
            "rounded-xl border bg-white p-4 shadow-elevated",
            isFlashing
              ? "border-success-400 ring-2 ring-success-200"
              : "border-ai-200 ring-1 ring-ai-100",
          )}
        >
          {/* Header */}
          <div className="mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-ai-500" />
            <span className="text-xs font-semibold text-ai-700">
              Match sugerido por la IA
            </span>
          </div>

          {/* Transaction */}
          <div className="rounded-lg bg-neutral-50 p-2.5">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
              Movimiento
            </p>
            <p className="line-clamp-2 text-xs font-medium text-neutral-800">
              {tx?.description}
            </p>
            <p
              className={cn(
                "mt-0.5 font-mono text-sm font-bold",
                tx?.type === "credit" ? "text-success-600" : "text-danger-600",
              )}
            >
              {tx?.type === "credit" ? "+" : "−"}
              {formatCurrency(Math.abs(tx?.amount ?? 0))}
            </p>
          </div>

          {/* Arrow */}
          <div className="my-2 flex items-center justify-center">
            <ArrowLeftRight className="h-3.5 w-3.5 text-neutral-400" />
          </div>

          {/* Invoice */}
          <div className="rounded-lg bg-neutral-50 p-2.5">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
              Factura
            </p>
            <p className="text-xs font-medium text-neutral-800">
              {invoice?.counterpartyName}
            </p>
            <p className="font-mono text-[10px] text-neutral-500">
              {invoice?.invoiceNumber}
            </p>
            <p className="mt-0.5 font-mono text-sm font-bold text-neutral-900">
              {formatCurrency(invoice?.totalAmount ?? 0)}
            </p>
          </div>

          {/* Difference */}
          <div className="mt-2.5 flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
            <span className="text-xs text-neutral-500">Diferencia</span>
            <span
              className={cn(
                "font-mono text-xs font-semibold",
                amountDiff === 0 ? "text-success-600" : "text-amber-600",
              )}
            >
              {amountDiff === 0
                ? "Sin diferencia"
                : formatCurrency(amountDiff)}
            </span>
          </div>

          {/* Confidence bar */}
          <div className="mt-2.5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-neutral-500">Confianza IA</span>
              <span className={cn("text-xs font-semibold", confidenceColor)}>
                {confidencePct}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <motion.div
                className={cn("h-full rounded-full", confidenceBg)}
                initial={{ width: 0 }}
                animate={{ width: `${confidencePct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Reason */}
          {match && (
            <p className="mt-2 text-[11px] leading-snug text-neutral-500">
              {MATCH_REASON[match.matchType]}
            </p>
          )}

          {/* Actions */}
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <button
              onClick={onConfirm}
              className="flex items-center justify-center gap-1 rounded-lg bg-success-600 px-2 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-success-700 active:scale-95"
            >
              <CheckCircle2 className="h-3 w-3" />
              Confirmar
            </button>
            <button
              onClick={onReject}
              className="flex items-center justify-center gap-1 rounded-lg border border-neutral-200 px-2 py-2 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 active:scale-95"
            >
              <XCircle className="h-3 w-3" />
              Rechazar
            </button>
            <button
              onClick={onSearchOther}
              className="flex items-center justify-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-2 py-2 text-[11px] font-medium text-primary-600 transition-colors hover:bg-primary-100 active:scale-95"
            >
              <Search className="h-3 w-3" />
              Buscar
            </button>
          </div>
        </motion.div>
      )}

      {noMatchVisible && (
        <motion.div
          key="no-match"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center"
        >
          <Search className="mx-auto mb-2 h-5 w-5 text-neutral-400" />
          <p className="text-xs font-medium text-neutral-500">
            Sin match sugerido
          </p>
          <p className="mt-1 text-[11px] text-neutral-400">
            La IA no encontró una factura correspondiente
          </p>
          <button
            onClick={onSearchOther}
            className="mt-3 rounded-input border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-100"
          >
            Buscar factura manualmente
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
