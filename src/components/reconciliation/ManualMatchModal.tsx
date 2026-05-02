"use client";

import { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, FileText, AlertCircle, Clock, Sparkles } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction, Invoice } from "@/lib/types";

interface ManualMatchModalProps {
  open: boolean;
  tx: Transaction | null;
  invoices: Invoice[];
  onClose: () => void;
  onSelect: (invoiceId: string) => void;
  matching?: boolean;
}

const INV_TYPE_LABEL: Record<Invoice["type"], string> = {
  factura_a: "FA",
  factura_b: "FB",
  factura_c: "FC",
  nota_credito: "NC",
  nota_debito: "ND",
  recibo: "REC",
};

export function ManualMatchModal({
  open,
  tx,
  invoices,
  onClose,
  onSelect,
  matching,
}: ManualMatchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedId(null);
    }
  }, [open, tx?.id]);

  // Sort invoices: closest amount first, then most recent
  const ranked = useMemo(() => {
    if (!tx) return invoices;
    const txAbs = Math.abs(tx.amount);
    return [...invoices].sort((a, b) => {
      const da = Math.abs(a.totalAmount - txAbs);
      const db = Math.abs(b.totalAmount - txAbs);
      if (da !== db) return da - db;
      return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
    });
  }, [invoices, tx]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter((inv) => {
      if (inv.counterpartyName.toLowerCase().includes(q)) return true;
      if (inv.invoiceNumber.toLowerCase().includes(q)) return true;
      if (inv.counterpartyCuit.includes(q.replace(/\D/g, ""))) return true;
      if (inv.totalAmount.toFixed(2).includes(q)) return true;
      return false;
    });
  }, [ranked, query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !matching && onClose()}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-card border border-neutral-200 bg-white shadow-elevated dark:border-white/[0.08] dark:bg-[#1C2336]"
            style={{ maxHeight: "min(85vh, 720px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4 dark:border-white/[0.06]">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900 dark:text-slate-100">
                  Vincular factura al movimiento
                </p>
                {tx && (
                  <div className="mt-2 rounded-lg bg-neutral-50 p-2.5 dark:bg-white/[0.03]">
                    <p className="line-clamp-1 text-xs font-medium text-neutral-700 dark:text-slate-300">
                      {tx.description}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-neutral-400 dark:text-slate-500">
                        {formatDate(tx.transactionDate)}
                      </span>
                      <span
                        className={cn(
                          "font-mono font-bold",
                          tx.type === "credit"
                            ? "text-success-600"
                            : "text-danger-600",
                        )}
                      >
                        {tx.type === "credit" ? "+" : "−"}
                        {formatCurrency(Math.abs(tx.amount))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                disabled={matching}
                className="shrink-0 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-50 dark:hover:bg-white/[0.05] dark:hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="shrink-0 border-b border-neutral-100 px-5 py-3 dark:border-white/[0.06]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Buscar por nombre, número, CUIT o monto…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 w-full rounded-input border border-neutral-200 bg-white pl-9 pr-3 text-xs text-neutral-700 placeholder:text-neutral-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-white/[0.08] dark:bg-[#0F1626] dark:text-slate-200 dark:placeholder:text-slate-500"
                />
              </div>
              <p className="mt-2 text-[11px] text-neutral-400 dark:text-slate-500">
                {filtered.length} factura{filtered.length !== 1 ? "s" : ""}{" "}
                {invoices.length !== filtered.length && `de ${invoices.length}`} —
                ordenadas por cercanía de monto
              </p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {invoices.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center px-6 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/[0.05]">
                    <FileText className="h-5 w-5 text-neutral-400" />
                  </div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-slate-300">
                    No hay facturas en el sistema
                  </p>
                  <p className="mt-1 text-xs text-neutral-400 dark:text-slate-500">
                    Cargá facturas desde la sección de Facturas para poder
                    conciliarlas
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center px-6 text-center">
                  <Search className="mb-2 h-5 w-5 text-neutral-300" />
                  <p className="text-sm text-neutral-500">Sin resultados</p>
                </div>
              ) : (
                filtered.map((inv) => {
                  const isSelected = selectedId === inv.id;
                  const txAbs = tx ? Math.abs(tx.amount) : 0;
                  const diff = Math.abs(inv.totalAmount - txAbs);
                  const exactAmount = diff < 0.01;
                  const closeAmount = !exactAmount && diff / inv.totalAmount < 0.05;

                  return (
                    <button
                      key={inv.id}
                      onClick={() => setSelectedId(inv.id)}
                      className={cn(
                        "mb-1 flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all",
                        isSelected
                          ? "border-primary-300 bg-primary-50 ring-1 ring-primary-200 dark:border-primary-500/40 dark:bg-primary-500/10"
                          : "border-transparent hover:border-neutral-200 hover:bg-neutral-50 dark:hover:border-white/[0.08] dark:hover:bg-white/[0.03]",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center gap-1.5">
                          <span className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[9px] font-bold text-neutral-500 dark:bg-white/[0.06] dark:text-slate-400">
                            {INV_TYPE_LABEL[inv.type]}
                          </span>
                          <span className="font-mono text-[10px] text-neutral-400 dark:text-slate-500">
                            {inv.invoiceNumber}
                          </span>
                          {exactAmount && (
                            <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-success-100 px-1.5 py-0.5 text-[9px] font-bold text-success-700 dark:bg-success-500/20 dark:text-success-400">
                              <Sparkles className="h-2 w-2" />
                              Monto exacto
                            </span>
                          )}
                          {closeAmount && (
                            <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                              Monto similar
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-1 text-xs font-medium text-neutral-800 dark:text-slate-200">
                          {inv.counterpartyName}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-400 dark:text-slate-500">
                          <span>CUIT {inv.counterpartyCuit}</span>
                          <span>·</span>
                          <span>Vto: {formatDate(inv.dueDate)}</span>
                          {inv.status === "overdue" && (
                            <span className="ml-auto inline-flex items-center gap-0.5 text-danger-500">
                              <AlertCircle className="h-2.5 w-2.5" />
                              Vencida
                            </span>
                          )}
                          {inv.status === "pending" && (
                            <span className="ml-auto inline-flex items-center gap-0.5 text-neutral-400">
                              <Clock className="h-2.5 w-2.5" />
                              Pendiente
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-sm font-bold text-neutral-900 dark:text-slate-100">
                          {formatCurrency(inv.totalAmount)}
                        </p>
                        {tx && diff > 0.01 && (
                          <p className="mt-0.5 font-mono text-[10px] text-amber-600">
                            Δ {formatCurrency(diff)}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-100 bg-neutral-50/50 px-5 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <button
                onClick={onClose}
                disabled={matching}
                className="rounded-input border border-neutral-200 px-4 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-white disabled:opacity-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.04]"
              >
                Cancelar
              </button>
              <button
                onClick={() => selectedId && onSelect(selectedId)}
                disabled={!selectedId || matching}
                className="rounded-input bg-primary-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {matching ? "Vinculando…" : "Vincular factura"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
