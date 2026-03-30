"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { usePageLoader } from "@/hooks/usePageLoader";
import { PageLoader } from "@/components/ui/PageLoader";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Tag } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  mockTransactions, mockStatements, mockBankAccounts,
  mockMatches, mockInvoices,
} from "@/lib/mock-data";
import type { Transaction, TransactionCategory, ReconciliationMatch, Invoice } from "@/lib/types";
import { TransactionFilters, type StatusTab, type SortOption, type TypeFilter } from "@/components/transactions/TransactionFilters";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionDrawer } from "@/components/transactions/TransactionDrawer";
import { BulkActionsBar } from "@/components/transactions/BulkActionsBar";
import { SummaryFooter } from "@/components/transactions/SummaryFooter";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

// ── Constantes ────────────────────────────────────────────────────────────────

const ALL_CATEGORIES: TransactionCategory[] = [
  "pago_proveedor", "cobro_cliente", "impuesto", "comision_bancaria",
  "transferencia_interna", "salario", "alquiler", "servicio",
  "retencion", "percepcion", "iva", "otros",
];

// Pre-build maps from mock data (stable, no deps)
const MATCH_MAP: Record<string, ReconciliationMatch | undefined> = {};
mockMatches.forEach((m) => {
  if (!MATCH_MAP[m.transactionId] || m.status === "suggested") {
    MATCH_MAP[m.transactionId] = m;
  }
});

const INVOICE_MAP: Record<string, Invoice | undefined> = {};
mockInvoices.forEach((inv) => { INVOICE_MAP[inv.id] = inv; });

// ── Statement selector ────────────────────────────────────────────────────────

function StatementSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = mockStatements.find((s) => s.id === value);
  const currentBank = mockBankAccounts.find(
    (ba) => ba.id === current?.bankAccountId,
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-input border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
      >
        <span className="font-medium">
          {currentBank?.bankName ?? "—"} —{" "}
          {current
            ? format(current.periodStart, "MMMM yyyy", { locale: es }).replace(
                /^\w/,
                (c) => c.toUpperCase(),
              )
            : ""}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-neutral-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-card border border-neutral-200 bg-white py-1 shadow-elevated">
            {mockStatements.map((stmt) => {
              const bank = mockBankAccounts.find(
                (ba) => ba.id === stmt.bankAccountId,
              );
              const period = format(stmt.periodStart, "MMMM yyyy", {
                locale: es,
              }).replace(/^\w/, (c) => c.toUpperCase());
              return (
                <button
                  key={stmt.id}
                  onClick={() => { onChange(stmt.id); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-neutral-50",
                    stmt.id === value && "bg-primary-50",
                  )}
                >
                  <div className="text-left">
                    <p className="font-medium text-neutral-900">
                      {bank?.bankName} — {period}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {stmt.transactionCount} movimientos · {stmt.matchedCount} conciliados
                    </p>
                  </div>
                  {stmt.id === value && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Bulk category modal ───────────────────────────────────────────────────────

function BulkCategoryModal({
  count,
  onSelect,
  onClose,
}: {
  count: number;
  onSelect: (cat: TransactionCategory) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm rounded-card border border-neutral-200 bg-white p-5 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
            <Tag className="h-4 w-4 text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Cambiar categoría</p>
            <p className="text-xs text-neutral-500">
              Para {count} transacción{count !== 1 ? "es" : ""}
            </p>
          </div>
        </div>
        <div className="max-h-52 overflow-y-auto rounded-lg border border-neutral-100">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-neutral-50 border-b border-neutral-50 last:border-0"
            >
              <CategoryBadge category={cat} size="sm" />
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-3 w-full rounded-input border border-neutral-200 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Cancelar
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function TransactionsPageContent() {
  // ── Statement ──
  const [stmtId, setStmtId] = useState("stmt-1");

  // ── Filters ──
  const [tab, setTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [categoryFilters, setCategoryFilters] = useState<TransactionCategory[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  // ── Interactions ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [drawerTxId, setDrawerTxId] = useState<string | null>(null);

  // ── Overrides (simulate API) ──
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, TransactionCategory>>({});
  const [matchStatusOverrides, setMatchStatusOverrides] = useState<Record<string, string>>({});

  // ── Bulk category modal ──
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // ── Derived data ──

  const allStmtTxs = useMemo(
    () => mockTransactions.filter((tx) => tx.statementId === stmtId),
    [stmtId],
  );

  const getEffectiveMatchStatus = useCallback(
    (tx: Transaction) => matchStatusOverrides[tx.id] ?? tx.matchStatus,
    [matchStatusOverrides],
  );

  const counts = useMemo(
    () => ({
      all: allStmtTxs.length,
      confirmed: allStmtTxs.filter(
        (tx) => getEffectiveMatchStatus(tx) === "confirmed",
      ).length,
      review: allStmtTxs.filter(
        (tx) => getEffectiveMatchStatus(tx) === "suggested",
      ).length,
      unmatched: allStmtTxs.filter(
        (tx) => getEffectiveMatchStatus(tx) === "unmatched",
      ).length,
    }),
    [allStmtTxs, getEffectiveMatchStatus],
  );

  const filteredTxs = useMemo(() => {
    let txs = allStmtTxs;

    // Tab
    if (tab !== "all") {
      txs = txs.filter((tx) => {
        const s = getEffectiveMatchStatus(tx);
        if (tab === "confirmed") return s === "confirmed";
        if (tab === "review") return s === "suggested";
        if (tab === "unmatched") return s === "unmatched";
        return true;
      });
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      txs = txs.filter((tx) => tx.description.toLowerCase().includes(q));
    }

    // Category filter
    if (categoryFilters.length > 0) {
      txs = txs.filter((tx) => {
        const cat = categoryOverrides[tx.id] ?? tx.aiCategory;
        return categoryFilters.includes(cat);
      });
    }

    // Type filter
    if (typeFilter !== "all") {
      txs = txs.filter((tx) => tx.type === typeFilter);
    }

    // Sort
    const sorted = [...txs];
    if (sortBy === "date") sorted.sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());
    if (sortBy === "amount") sorted.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    if (sortBy === "confidence") sorted.sort((a, b) => b.aiConfidence - a.aiConfidence);

    return sorted;
  }, [allStmtTxs, tab, search, categoryFilters, typeFilter, sortBy, categoryOverrides, getEffectiveMatchStatus]);

  const totals = useMemo(() => {
    const credits = filteredTxs
      .filter((tx) => tx.type === "credit")
      .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const debits = filteredTxs
      .filter((tx) => tx.type === "debit")
      .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    return { credits, debits, balance: credits - debits };
  }, [filteredTxs]);

  // ── Statement info for subtitle ──
  const currentStmt = mockStatements.find((s) => s.id === stmtId);
  const currentBank = mockBankAccounts.find(
    (ba) => ba.id === currentStmt?.bankAccountId,
  );
  const stmtSubtitle = currentStmt && currentBank
    ? `Extracto ${currentBank.bankName} — ${format(currentStmt.periodStart, "MMMM yyyy", { locale: es }).replace(/^\w/, (c) => c.toUpperCase())} · ${currentStmt.transactionCount} movimientos`
    : "";

  // ── Handlers ──

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === filteredTxs.length) return new Set();
      return new Set(filteredTxs.map((tx) => tx.id));
    });
  }, [filteredTxs]);

  const handleCategoryOverride = useCallback(
    (id: string, cat: TransactionCategory) => {
      setCategoryOverrides((prev) => ({ ...prev, [id]: cat }));
      toast.success("Categoría actualizada. La IA aprenderá de esta corrección.", {
        icon: "🧠",
        duration: 3500,
      });
    },
    [],
  );

  const handleToggleMatchPanel = useCallback((id: string) => {
    setExpandedMatchId((prev) => (prev === id ? null : id));
  }, []);

  const handleConfirmMatch = useCallback((txId: string) => {
    setMatchStatusOverrides((prev) => ({ ...prev, [txId]: "confirmed" }));
    setExpandedMatchId(null);
    toast.success("¡Match confirmado!");
  }, []);

  const handleRejectMatch = useCallback((txId: string) => {
    setMatchStatusOverrides((prev) => ({ ...prev, [txId]: "unmatched" }));
    setExpandedMatchId(null);
  }, []);

  const handleBulkCategorySelect = useCallback(
    (cat: TransactionCategory) => {
      const count = selectedIds.size;
      setCategoryOverrides((prev) => {
        const next = { ...prev };
        selectedIds.forEach((id) => { next[id] = cat; });
        return next;
      });
      setSelectedIds(new Set());
      setBulkModalOpen(false);
      toast.success(`Categoría actualizada en ${count} transacciones.`, { icon: "🏷️" });
    },
    [selectedIds],
  );

  const hasMatchable = useMemo(
    () =>
      Array.from(selectedIds).some((id) => {
        const tx = mockTransactions.find((t) => t.id === id);
        return tx && (matchStatusOverrides[id] ?? tx.matchStatus) === "suggested";
      }),
    [selectedIds, matchStatusOverrides],
  );

  const handleBulkConfirmMatches = useCallback(() => {
    let confirmed = 0;
    selectedIds.forEach((id) => {
      const tx = mockTransactions.find((t) => t.id === id);
      if (tx && (matchStatusOverrides[id] ?? tx.matchStatus) === "suggested") {
        setMatchStatusOverrides((prev) => ({ ...prev, [id]: "confirmed" }));
        confirmed++;
      }
    });
    setSelectedIds(new Set());
    if (confirmed > 0) toast.success(`${confirmed} matches confirmados.`);
  }, [selectedIds, matchStatusOverrides]);

  // ── Render ──

  return (
    <div className="flex flex-col gap-0 pb-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
            Transacciones
          </h1>
          {stmtSubtitle && (
            <p className="mt-1 text-sm text-neutral-500">{stmtSubtitle}</p>
          )}
        </div>
        <StatementSelector value={stmtId} onChange={(id) => { setStmtId(id); setSelectedIds(new Set()); setExpandedMatchId(null); setSearch(""); setTab("all"); }} />
      </div>

      {/* Filters (sticky) */}
      <TransactionFilters
        activeTab={tab}
        onTabChange={(t) => { setTab(t); setSelectedIds(new Set()); }}
        counts={counts}
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        categoryFilters={categoryFilters}
        onCategoryFilterChange={setCategoryFilters}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        onExport={() => toast.success("Exportando transacciones…")}
      />

      {/* Table */}
      <div className="mt-4">
        <TransactionTable
          transactions={filteredTxs}
          categoryOverrides={categoryOverrides}
          matchStatusOverrides={matchStatusOverrides}
          selectedIds={selectedIds}
          expandedMatchId={expandedMatchId}
          matchMap={MATCH_MAP}
          invoiceMap={INVOICE_MAP}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onCategoryOverride={handleCategoryOverride}
          onToggleMatchPanel={handleToggleMatchPanel}
          onConfirmMatch={handleConfirmMatch}
          onRejectMatch={handleRejectMatch}
          onOpenDrawer={(id) => setDrawerTxId(id)}
        />
      </div>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <BulkActionsBar
            count={selectedIds.size}
            hasMatchable={hasMatchable}
            onChangeCategory={() => setBulkModalOpen(true)}
            onConfirmMatches={handleBulkConfirmMatches}
            onExport={() => toast.success("Exportando selección…")}
            onDeselectAll={() => setSelectedIds(new Set())}
          />
        )}
      </AnimatePresence>

      {/* Bulk category modal */}
      <AnimatePresence>
        {bulkModalOpen && (
          <BulkCategoryModal
            count={selectedIds.size}
            onSelect={handleBulkCategorySelect}
            onClose={() => setBulkModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <TransactionDrawer
        transactionId={drawerTxId}
        transactions={mockTransactions}
        categoryOverrides={categoryOverrides}
        matchStatusOverrides={matchStatusOverrides}
        invoiceMap={INVOICE_MAP}
        onClose={() => setDrawerTxId(null)}
      />

      {/* Footer (sticky bottom) */}
      <SummaryFooter
        credits={totals.credits}
        debits={totals.debits}
        balance={totals.balance}
        filteredCount={filteredTxs.length}
        totalCount={allStmtTxs.length}
      />
    </div>
  );
}

export default function TransactionsPage() {
  const loading = usePageLoader();
  if (loading) return <PageLoader variant="table" />;
  return <TransactionsPageContent />;
}
