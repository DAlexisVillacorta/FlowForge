"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Building,
  Hash,
  CreditCard,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InvoiceTypeBadge, getInvoiceTypeLabel } from "./InvoiceTypeBadge";
import { mockTransactions } from "@/lib/mock-data";
import type { Invoice, Transaction } from "@/lib/types";

// ── Static tx lookup ──────────────────────────────────────────────────────────

// Map invoice ID → confirmed/matched transaction(s)
const TX_BY_INVOICE: Record<string, Transaction[]> = {};
for (const tx of mockTransactions) {
  if (tx.matchedInvoiceId) {
    if (!TX_BY_INVOICE[tx.matchedInvoiceId]) {
      TX_BY_INVOICE[tx.matchedInvoiceId] = [];
    }
    TX_BY_INVOICE[tx.matchedInvoiceId].push(tx);
  }
}

// AI suggestions for pending/partial invoices: pick unmatched txs with close amounts
const SUGGESTIONS: Record<string, Transaction[]> = {};
const unmatched = mockTransactions.filter(
  (tx) => tx.matchStatus === "unmatched" || tx.matchStatus === "suggested",
);
for (const inv of [
  { id: "inv-6", amount: 520_000 },
  { id: "inv-8", amount: 681_350 },
  { id: "inv-13", amount: 18_150 },
  { id: "inv-16", amount: 475_400 },
  { id: "inv-17", amount: 47_800 },
]) {
  SUGGESTIONS[inv.id] = unmatched
    .filter((tx) => Math.abs(Math.abs(tx.amount) - inv.amount) / inv.amount < 0.30)
    .slice(0, 3);
}

// ── Mini transaction card ─────────────────────────────────────────────────────

function TxMiniCard({
  tx,
  isLinked,
}: {
  tx: Transaction;
  isLinked: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        isLinked
          ? "border-success-200 bg-success-50"
          : "border-neutral-200 bg-neutral-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-neutral-800">
            {tx.description}
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            {formatDate(tx.transactionDate)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={cn(
              "font-mono text-sm font-bold",
              tx.amount < 0 ? "text-danger-600" : "text-success-600",
            )}
          >
            {formatCurrency(Math.abs(tx.amount))}
          </p>
          {isLinked && (
            <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-success-700">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Vinculada
            </span>
          )}
          {!isLinked && (
            <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-ai-600">
              <Sparkles className="h-2.5 w-2.5" />
              IA sugiere
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Detail row ────────────────────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
        <Icon className="h-3.5 w-3.5 text-neutral-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          {label}
        </p>
        <p className={cn("mt-0.5 text-sm font-medium text-neutral-800", valueClass)}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ── InvoiceDrawer ─────────────────────────────────────────────────────────────

interface InvoiceDrawerProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export function InvoiceDrawer({ invoice, onClose }: InvoiceDrawerProps) {
  const isOpen = !!invoice;

  const linkedTxs = invoice ? (TX_BY_INVOICE[invoice.id] ?? []) : [];
  const suggestedTxs = invoice ? (SUGGESTIONS[invoice.id] ?? []) : [];
  const hasPdf = false; // MVP: no real files

  const isOverdue = invoice?.status === "overdue";
  const isPending =
    invoice?.status === "pending" || invoice?.status === "partially_matched";
  const isMatched = invoice?.status === "matched";

  return (
    <AnimatePresence>
      {isOpen && invoice && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-neutral-900/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col bg-white shadow-modal"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4">
              <div className="flex items-start gap-3">
                <InvoiceTypeBadge type={invoice.type} />
                <div>
                  <code className="block font-mono text-sm font-bold text-neutral-900">
                    {invoice.invoiceNumber}
                  </code>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {getInvoiceTypeLabel(invoice.type)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={invoice.status} size="sm" />
                <button
                  onClick={onClose}
                  className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
              {/* Overdue alert */}
              {isOverdue && (
                <div className="mb-4 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3">
                  <p className="text-sm font-semibold text-danger-700">
                    ⚠ Factura vencida
                  </p>
                  <p className="mt-0.5 text-xs text-danger-600">
                    Venció el {formatDate(invoice.dueDate)}. Revisá el estado del
                    pago con tu proveedor.
                  </p>
                </div>
              )}

              {/* Core info */}
              <div className="divide-y divide-neutral-100">
                <DetailRow
                  icon={Building}
                  label="Proveedor / Cliente"
                  value={invoice.counterpartyName}
                />
                <DetailRow
                  icon={Hash}
                  label="CUIT"
                  value={invoice.counterpartyCuit}
                  valueClass="font-mono"
                />
                <DetailRow
                  icon={Calendar}
                  label="Fecha de emisión"
                  value={formatDate(invoice.issueDate)}
                />
                <DetailRow
                  icon={Calendar}
                  label="Fecha de vencimiento"
                  value={formatDate(invoice.dueDate)}
                  valueClass={isOverdue ? "text-danger-600 font-semibold" : ""}
                />
              </div>

              {/* Amounts */}
              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Importes
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Neto</span>
                    <span className="font-mono text-sm font-medium text-neutral-800">
                      {formatCurrency(invoice.netAmount)}
                    </span>
                  </div>
                  {invoice.ivaAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600">IVA</span>
                      <span className="font-mono text-sm text-neutral-500">
                        {formatCurrency(invoice.ivaAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-neutral-200 pt-2">
                    <span className="text-sm font-semibold text-neutral-800">
                      Total
                    </span>
                    <span className="font-mono text-base font-bold text-neutral-900">
                      {formatCurrency(invoice.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked transactions */}
              {(isMatched || linkedTxs.length > 0) && (
                <div className="mt-5">
                  <div className="mb-2.5 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-600" />
                    <h3 className="text-sm font-semibold text-neutral-800">
                      Transacción vinculada
                    </h3>
                    <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="text-xs text-neutral-400">
                      Ver conciliación
                    </span>
                  </div>
                  <div className="space-y-2">
                    {linkedTxs.length > 0 ? (
                      linkedTxs.map((tx) => (
                        <TxMiniCard key={tx.id} tx={tx} isLinked />
                      ))
                    ) : (
                      <p className="text-xs text-neutral-400">
                        No se encontró la transacción correspondiente.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* AI suggestions for pending */}
              {isPending && (
                <div className="mt-5">
                  <div className="mb-2.5 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-ai-600" />
                    <h3 className="text-sm font-semibold text-neutral-800">
                      Transacciones posibles
                    </h3>
                    <span className="rounded-full bg-ai-100 px-1.5 py-0.5 text-[10px] font-bold text-ai-700">
                      IA
                    </span>
                  </div>
                  {suggestedTxs.length > 0 ? (
                    <div className="space-y-2">
                      {suggestedTxs.map((tx) => (
                        <TxMiniCard key={tx.id} tx={tx} isLinked={false} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-5 text-center">
                      <p className="text-xs text-neutral-400">
                        No se encontraron transacciones candidatas en los
                        extractos cargados.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-neutral-100 px-5 py-4">
              <button
                disabled={!hasPdf}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-input border px-4 py-2 text-sm font-medium transition-colors",
                  hasPdf
                    ? "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                    : "cursor-not-allowed border-neutral-100 bg-neutral-50 text-neutral-300",
                )}
                title={!hasPdf ? "Sin PDF adjunto" : "Descargar PDF"}
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </button>
              <button
                onClick={onClose}
                className="flex flex-1 items-center justify-center gap-2 rounded-input bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                <CreditCard className="h-4 w-4" />
                Ver en conciliación
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
