"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, Pencil, CheckCircle2, FileText, Clock, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn, formatCurrency, formatDate, getCategoryLabel } from "@/lib/utils";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Transaction, TransactionCategory, Invoice } from "@/lib/types";

// ── Detail row ────────────────────────────────────────────────────────────────

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-neutral-100 last:border-0">
      <span className="text-xs text-neutral-500 shrink-0">{label}</span>
      <span className={cn("text-xs font-medium text-neutral-900 text-right", mono && "font-mono tabular-nums")}>
        {value}
      </span>
    </div>
  );
}

// ── Timeline entry ────────────────────────────────────────────────────────────

function TimelineEntry({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  timestamp,
  isLast,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  timestamp: string;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", iconBg)}>
          <Icon className={cn("h-3.5 w-3.5", iconColor)} />
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-neutral-100" style={{ minHeight: 12 }} />}
      </div>
      <div className={cn("min-w-0 flex-1", !isLast && "pb-3")}>
        <p className="text-xs leading-snug text-neutral-700">{label}</p>
        <p className="mt-0.5 text-[11px] text-neutral-400">{timestamp}</p>
      </div>
    </div>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────────

interface TransactionDrawerProps {
  transactionId: string | null;
  transactions: Transaction[];
  categoryOverrides: Record<string, TransactionCategory>;
  matchStatusOverrides: Record<string, string>;
  invoiceMap: Record<string, Invoice | undefined>;
  onClose: () => void;
}

export function TransactionDrawer({
  transactionId,
  transactions,
  categoryOverrides,
  matchStatusOverrides,
  invoiceMap,
  onClose,
}: TransactionDrawerProps) {
  const tx = transactionId ? transactions.find((t) => t.id === transactionId) : null;

  const effectiveCategory = tx ? (categoryOverrides[tx.id] ?? tx.aiCategory) : null;
  const effectiveMatchStatus = tx ? (matchStatusOverrides[tx.id] ?? tx.matchStatus) : null;
  const isOverridden = tx ? Boolean(categoryOverrides[tx.id]) : false;

  const matchedInvoice =
    tx?.matchedInvoiceId ? invoiceMap[tx.matchedInvoiceId] : undefined;

  // Classification timeline
  const timeline = tx
    ? [
        {
          icon: Brain,
          iconBg: "bg-ai-50",
          iconColor: "text-ai-600",
          label: `IA clasificó como: ${getCategoryLabel(tx.aiCategory)} (${Math.round(tx.aiConfidence * 100)}% confianza)`,
          timestamp: formatDate(tx.transactionDate),
        },
        ...(isOverridden && effectiveCategory
          ? [
              {
                icon: Pencil,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
                label: `Usuario corrigió a: ${getCategoryLabel(effectiveCategory)}`,
                timestamp: "Hace un momento",
              },
            ]
          : tx.userCategory
            ? [
                {
                  icon: Pencil,
                  iconBg: "bg-amber-50",
                  iconColor: "text-amber-600",
                  label: `Usuario corrigió a: ${getCategoryLabel(tx.userCategory)}`,
                  timestamp: formatDate(tx.transactionDate),
                },
              ]
            : []),
        ...(effectiveMatchStatus === "confirmed"
          ? [
              {
                icon: CheckCircle2,
                iconBg: "bg-success-50",
                iconColor: "text-success-600",
                label: "Match confirmado",
                timestamp: formatDate(tx.transactionDate),
              },
            ]
          : []),
      ]
    : [];

  return (
    <AnimatePresence>
      {transactionId && tx && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-elevated"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-neutral-100 px-5 py-4">
              <div className="min-w-0 flex-1 pr-4">
                <h3 className="font-heading text-base font-bold text-neutral-900 line-clamp-2">
                  {tx.description}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-xs text-neutral-400">
                    {formatDate(tx.transactionDate)}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-base font-bold",
                      tx.type === "credit" ? "text-success-600" : "text-danger-600",
                    )}
                  >
                    {tx.type === "credit" ? "+" : "-"}
                    {formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Status badges */}
              <div className="flex flex-wrap items-center gap-2">
                {effectiveCategory && <CategoryBadge category={effectiveCategory} />}
                {effectiveMatchStatus && (
                  <StatusBadge
                    status={
                      effectiveMatchStatus as Parameters<typeof StatusBadge>[0]["status"]
                    }
                  />
                )}
                {tx.type === "credit" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-success-200 bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700">
                    <ArrowDownLeft className="h-3 w-3" />
                    Crédito
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-danger-200 bg-danger-50 px-2.5 py-1 text-xs font-medium text-danger-700">
                    <ArrowUpRight className="h-3 w-3" />
                    Débito
                  </span>
                )}
              </div>

              {/* Details */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Detalles
                </p>
                <div>
                  <DetailRow label="ID transacción" value={tx.id} mono />
                  <DetailRow label="Fecha" value={formatDate(tx.transactionDate)} />
                  <DetailRow label="Monto" value={formatCurrency(Math.abs(tx.amount))} mono />
                  <DetailRow
                    label="Categoría IA"
                    value={getCategoryLabel(tx.aiCategory)}
                  />
                  <DetailRow
                    label="Confianza IA"
                    value={`${Math.round(tx.aiConfidence * 100)}%`}
                    mono
                  />
                </div>
              </div>

              {/* Factura linkeada */}
              {matchedInvoice && effectiveMatchStatus === "confirmed" && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Factura conciliada
                  </p>
                  <div className="rounded-xl border border-success-200 bg-success-50/50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success-100">
                        <FileText className="h-4.5 w-4.5 h-[18px] w-[18px] text-success-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neutral-900">
                          {matchedInvoice.counterpartyName}
                        </p>
                        <p className="font-mono text-xs text-neutral-500">
                          {matchedInvoice.invoiceNumber}
                        </p>
                        <p className="mt-1 font-mono text-sm font-bold text-neutral-900">
                          {formatCurrency(matchedInvoice.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sin match: botón buscar */}
              {(effectiveMatchStatus === "unmatched") && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Conciliación
                  </p>
                  <button className="flex w-full items-center justify-center gap-2 rounded-input border border-dashed border-neutral-300 py-3 text-sm font-medium text-neutral-500 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600">
                    <FileText className="h-4 w-4" />
                    Buscar factura para conciliar
                  </button>
                </div>
              )}

              {/* Historial de clasificación */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Historial
                </p>
                <div>
                  {timeline.map((entry, i) => (
                    <TimelineEntry
                      key={i}
                      {...entry}
                      isLast={i === timeline.length - 1}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer acciones */}
            <div className="border-t border-neutral-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-neutral-400">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(tx.transactionDate)}
                </div>
                <div className="flex-1" />
                <button
                  onClick={onClose}
                  className="rounded-input px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
