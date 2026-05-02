"use client";

import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FileText,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { ConnectionLines, type LineInput } from "./ConnectionLines";
import { MatchDetailCard } from "./MatchDetailCard";
import type { Transaction, Invoice, ReconciliationMatch } from "@/lib/types";

// ── Invoice type labels ────────────────────────────────────────────────────────

const INV_TYPE_LABEL: Record<Invoice["type"], string> = {
  factura_a: "FA",
  factura_b: "FB",
  factura_c: "FC",
  nota_credito: "NC",
  nota_debito: "ND",
  recibo: "REC",
};

// ── Transaction row ───────────────────────────────────────────────────────────

function TxRow({
  tx,
  isSelected,
  hasSuggestedMatch,
  isConfirmed,
  onClick,
}: {
  tx: Transaction;
  isSelected: boolean;
  hasSuggestedMatch: boolean;
  isConfirmed: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      id={`recon-tx-${tx.id}`}
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-lg border px-3 py-2.5 text-left transition-all duration-150",
        isSelected
          ? "border-ai-400 bg-ai-50/60 ring-1 ring-ai-300"
          : hasSuggestedMatch
            ? "border-ai-200 bg-white hover:border-ai-300 hover:bg-ai-50/30"
            : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50",
        isConfirmed && "cursor-default opacity-50",
      )}
    >
      {/* Pulsing dot for suggested matches */}
      {hasSuggestedMatch && !isSelected && (
        <span className="absolute right-2.5 top-2.5 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ai-400 opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-ai-500" />
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 font-mono text-[10px] text-neutral-400">
            {formatDate(tx.transactionDate)}
          </p>
          <p className="line-clamp-2 text-xs font-medium leading-snug text-neutral-800">
            {tx.description}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <CategoryBadge category={tx.aiCategory} size="sm" />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={cn(
              "font-mono text-sm font-bold",
              tx.type === "credit" ? "text-success-600" : "text-danger-600",
            )}
          >
            {tx.type === "credit" ? "+" : "−"}
            {formatCurrency(Math.abs(tx.amount))}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

// ── Invoice row ───────────────────────────────────────────────────────────────

function InvRow({
  invoice,
  isHighlighted,
  isActiveTarget,
}: {
  invoice: Invoice;
  isHighlighted: boolean; // suggested for selected tx
  isActiveTarget: boolean;
}) {
  const isOverdue = invoice.status === "overdue";

  return (
    <motion.div
      id={`recon-inv-${invoice.id}`}
      layout
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-lg border px-3 py-2.5 transition-all duration-150",
        isActiveTarget
          ? "border-ai-400 bg-ai-50/60 ring-1 ring-ai-300"
          : isHighlighted
            ? "border-ai-200 bg-white"
            : "border-neutral-200 bg-white opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-1.5">
            <span className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[9px] font-bold text-neutral-500">
              {INV_TYPE_LABEL[invoice.type]}
            </span>
            <span className="font-mono text-[10px] text-neutral-400">
              {invoice.invoiceNumber}
            </span>
          </div>
          <p className="line-clamp-1 text-xs font-medium text-neutral-800">
            {invoice.counterpartyName}
          </p>
          <div className="mt-1 flex items-center gap-1">
            {isOverdue && (
              <span className="flex items-center gap-0.5 text-[10px] text-danger-600">
                <AlertCircle className="h-2.5 w-2.5" />
                Vencida
              </span>
            )}
            {invoice.status === "pending" && (
              <span className="flex items-center gap-0.5 text-[10px] text-neutral-400">
                <Clock className="h-2.5 w-2.5" />
                Pendiente
              </span>
            )}
            {invoice.status === "partially_matched" && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                <Sparkles className="h-2.5 w-2.5" />
                Parcial
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-sm font-bold text-neutral-900">
            {formatCurrency(invoice.totalAmount)}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-neutral-400">
            Vto: {formatDate(invoice.dueDate)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Panel headers ─────────────────────────────────────────────────────────────

function PanelHeader({
  title,
  count,
  icon: Icon,
}: {
  title: string;
  count: number;
  icon: React.ElementType;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100">
        <Icon className="h-3.5 w-3.5 text-neutral-500" />
      </div>
      <span className="text-sm font-semibold text-neutral-700">{title}</span>
      <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-500">
        {count}
      </span>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const delta = 2;
  const rawRange: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || (i >= page - delta && i <= page + delta)) {
      rawRange.push(i);
    }
  }

  const withEllipsis: (number | "…")[] = [];
  let prev: number | null = null;
  for (const p of rawRange) {
    if (prev !== null && p - prev > 1) withEllipsis.push("…");
    withEllipsis.push(p);
    prev = p;
  }

  return (
    <div className="mt-3 flex items-center justify-center gap-1 border-t border-neutral-100 pt-3">
      <button
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-30"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      {withEllipsis.map((item, idx) =>
        item === "…" ? (
          <span key={`e${idx}`} className="px-0.5 text-xs text-neutral-400">
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onChange(item)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors",
              item === page
                ? "bg-primary-600 text-white"
                : "text-neutral-500 hover:bg-neutral-100",
            )}
          >
            {item + 1}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
        disabled={page === totalPages - 1}
        className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-30"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── SplitView ─────────────────────────────────────────────────────────────────

interface SplitViewProps {
  pendingTxs: Transaction[];
  pendingInvoices: Invoice[];
  suggestedMatches: ReconciliationMatch[];
  flashingMatchId: string | null;
  selectedTxId: string | null;
  onSelectTx: (id: string | null) => void;
  onConfirmMatch: (matchId: string) => void;
  onRejectMatch: (matchId: string) => void;
  onManualMatch?: () => void;
  invoiceMap: Record<string, Invoice | undefined>;
  txMap: Record<string, Transaction | undefined>;
  matchByTxId: Record<string, ReconciliationMatch | undefined>;
}

export function SplitView({
  pendingTxs,
  pendingInvoices,
  suggestedMatches,
  flashingMatchId,
  selectedTxId,
  onSelectTx,
  onConfirmMatch,
  onRejectMatch,
  onManualMatch,
  invoiceMap,
  matchByTxId,
}: SplitViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const [txPage, setTxPage] = useState(0);

  // Reset page when the transaction list changes (search filter or confirmed match)
  useEffect(() => { setTxPage(0); }, [pendingTxs]);

  const txTotalPages = Math.ceil(pendingTxs.length / PAGE_SIZE);
  const pagedTxs = pendingTxs.slice(txPage * PAGE_SIZE, (txPage + 1) * PAGE_SIZE);
  const pagedTxIds = new Set(pagedTxs.map((tx) => tx.id));

  // Build SVG line inputs — only for txs visible on current page
  const lineInputs: LineInput[] = suggestedMatches
    .filter((m) => pagedTxIds.has(m.transactionId))
    .map((m) => ({
      matchId: m.id,
      txId: m.transactionId,
      invoiceId: m.invoiceId,
      confidence: m.confidenceScore,
      status: flashingMatchId === m.id ? "flashing" : "suggested",
      isActive: selectedTxId === m.transactionId,
    }));

  // Selected match info — search full list so selection survives page changes
  const selectedMatch = selectedTxId ? matchByTxId[selectedTxId] ?? null : null;
  const selectedTx = pendingTxs.find((t) => t.id === selectedTxId) ?? null;
  const selectedInvoice = selectedMatch ? (invoiceMap[selectedMatch.invoiceId] ?? null) : null;

  // Which invoice IDs are suggested for the selected tx
  const suggestedInvoiceIds = new Set(
    suggestedMatches
      .filter((m) => m.transactionId === selectedTxId)
      .map((m) => m.invoiceId),
  );

  // Build match lookup: invoice → suggested tx
  const invoiceSuggestedMap = new Map<string, boolean>();
  suggestedMatches.forEach((m) => invoiceSuggestedMap.set(m.invoiceId, true));

  const isFlashing = flashingMatchId !== null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-subtle">
      {/* Desktop: 3-column split */}
      <div
        ref={containerRef}
        className="relative hidden min-h-[400px] lg:grid"
        style={{ gridTemplateColumns: "1fr 288px 1fr" }}
      >
        {/* SVG connection lines — spans full container */}
        <ConnectionLines
          containerRef={containerRef}
          leftPanelRef={leftPanelRef}
          rightPanelRef={rightPanelRef}
          lines={lineInputs}
        />

        {/* ── Left panel: transactions ── */}
        <div
          ref={leftPanelRef}
          className="relative z-10 border-r border-neutral-100 p-4"
        >
          <PanelHeader
            title="Extracto bancario"
            count={pendingTxs.length}
            icon={CheckCircle2}
          />
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {pagedTxs.map((tx) => {
                const match = matchByTxId[tx.id];
                return (
                  <TxRow
                    key={tx.id}
                    tx={tx}
                    isSelected={selectedTxId === tx.id}
                    hasSuggestedMatch={!!match}
                    isConfirmed={false}
                    onClick={() =>
                      onSelectTx(selectedTxId === tx.id ? null : tx.id)
                    }
                  />
                );
              })}
            </AnimatePresence>
            {pendingTxs.length === 0 && (
              <p className="py-8 text-center text-sm text-neutral-400">
                ¡Todos los movimientos están conciliados!
              </p>
            )}
          </div>
          <Pagination page={txPage} totalPages={txTotalPages} onChange={setTxPage} />
        </div>

        {/* ── Center column: connection lines + match card ── */}
        <div className="relative z-10 flex flex-col p-4">
          {selectedTxId ? (
            <MatchDetailCard
              tx={selectedTx}
              invoice={selectedInvoice}
              match={selectedMatch}
              isFlashing={
                isFlashing && flashingMatchId === selectedMatch?.id
              }
              onConfirm={() =>
                selectedMatch && onConfirmMatch(selectedMatch.id)
              }
              onReject={() =>
                selectedMatch && onRejectMatch(selectedMatch.id)
              }
              onSearchOther={() => onManualMatch?.()}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ai-50">
                <Sparkles className="h-5 w-5 text-ai-500" />
              </div>
              <p className="text-xs font-medium text-neutral-500">
                Seleccioná un movimiento
              </p>
              <p className="mt-1 text-[11px] text-neutral-400">
                La IA muestra el match sugerido
              </p>
              {suggestedMatches.length > 0 && (
                <p className="mt-3 rounded-full bg-ai-50 px-3 py-1 text-[11px] font-medium text-ai-600">
                  {suggestedMatches.length} match
                  {suggestedMatches.length !== 1 ? "es" : ""} pendiente
                  {suggestedMatches.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel: invoices ── */}
        <div
          ref={rightPanelRef}
          className="relative z-10 border-l border-neutral-100 p-4"
        >
          <PanelHeader
            title="Facturas pendientes"
            count={pendingInvoices.length}
            icon={FileText}
          />
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {pendingInvoices.map((inv) => (
                <InvRow
                  key={inv.id}
                  invoice={inv}
                  isHighlighted={invoiceSuggestedMap.get(inv.id) ?? false}
                  isActiveTarget={suggestedInvoiceIds.has(inv.id)}
                />
              ))}
            </AnimatePresence>
            {pendingInvoices.length === 0 && (
              <p className="py-8 text-center text-sm text-neutral-400">
                Todas las facturas están conciliadas.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="lg:hidden divide-y divide-neutral-100">
        {/* Transactions panel */}
        <div className="p-4">
          <PanelHeader
            title="Extracto bancario"
            count={pendingTxs.length}
            icon={CheckCircle2}
          />
          <div className="space-y-2">
            {pagedTxs.map((tx) => {
              const match = matchByTxId[tx.id];
              const suggestedInv = match ? invoiceMap[match.invoiceId] : null;
              return (
                <div key={tx.id}>
                  <TxRow
                    tx={tx}
                    isSelected={selectedTxId === tx.id}
                    hasSuggestedMatch={!!match}
                    isConfirmed={false}
                    onClick={() =>
                      onSelectTx(selectedTxId === tx.id ? null : tx.id)
                    }
                  />
                  {/* Mobile match arrow */}
                  <AnimatePresence>
                    {selectedTxId === tx.id && match && suggestedInv && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="my-2 flex flex-col items-center">
                          <ArrowRight className="h-4 w-4 rotate-90 text-ai-400" />
                        </div>
                        <MatchDetailCard
                          tx={tx}
                          invoice={suggestedInv}
                          match={match}
                          isFlashing={flashingMatchId === match.id}
                          onConfirm={() => onConfirmMatch(match.id)}
                          onReject={() => onRejectMatch(match.id)}
                          onSearchOther={() => onManualMatch?.()}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          <Pagination page={txPage} totalPages={txTotalPages} onChange={setTxPage} />
        </div>

        {/* Invoices panel */}
        <div className="p-4">
          <PanelHeader
            title="Facturas pendientes"
            count={pendingInvoices.length}
            icon={FileText}
          />
          <div className="space-y-2">
            {pendingInvoices.map((inv) => (
              <InvRow
                key={inv.id}
                invoice={inv}
                isHighlighted={invoiceSuggestedMap.get(inv.id) ?? false}
                isActiveTarget={suggestedInvoiceIds.has(inv.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
