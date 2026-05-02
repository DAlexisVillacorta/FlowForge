"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { usePageLoader } from "@/hooks/usePageLoader";
import { PageLoader } from "@/components/ui/PageLoader";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Tag, Trash2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionCategory, ReconciliationMatch, Invoice } from "@/lib/types";
import { TransactionFilters, type StatusTab, type SortOption, type TypeFilter } from "@/components/transactions/TransactionFilters";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionDrawer } from "@/components/transactions/TransactionDrawer";
import { BulkActionsBar } from "@/components/transactions/BulkActionsBar";
import { SummaryFooter } from "@/components/transactions/SummaryFooter";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

const ALL_CATEGORIES: TransactionCategory[] = [
  "pago_proveedor", "cobro_cliente", "impuesto", "comision_bancaria",
  "transferencia_interna", "salario", "alquiler", "servicio",
  "retencion", "percepcion", "iva", "otros",
];

function StatementSelector({
  value,
  onChange,
  onDeleteRequest,
  statements,
}: {
  value: string;
  onChange: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  statements: Array<{
    id: string;
    bankAccountId: string;
    periodStart: Date;
    transactionCount: number;
    matchedCount: number;
    bankAccount?: { bankName: string };
  }>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = statements.find((s) => s.id === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-input border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/[0.08] dark:bg-[#1C2336] dark:text-slate-200 dark:hover:border-white/[0.15] dark:hover:bg-white/[0.05]"
      >
        <span className="font-medium">
          {current?.bankAccount?.bankName ?? "—"} —{" "}
          {current
            ? format(current.periodStart, "MMMM yyyy", { locale: es }).replace(
                /^\w/,
                (c) => c.toUpperCase(),
              )
            : ""}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-neutral-400 transition-transform dark:text-slate-500",
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
          <div className="absolute right-0 top-full z-50 mt-1 max-h-72 w-80 overflow-y-auto rounded-card border border-neutral-200 bg-white py-1 shadow-elevated dark:border-white/[0.08] dark:bg-[#1C2336]">
            {statements.map((stmt) => {
              const period = format(stmt.periodStart, "MMMM yyyy", {
                locale: es,
              }).replace(/^\w/, (c) => c.toUpperCase());
              return (
                <div
                  key={stmt.id}
                  className={cn(
                    "group flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-white/[0.04]",
                    stmt.id === value && "bg-primary-50 dark:bg-primary-500/10",
                  )}
                >
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => { onChange(stmt.id); setOpen(false); }}
                  >
                    <p className="font-medium text-neutral-900 dark:text-slate-100">
                      {stmt.bankAccount?.bankName} — {period}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-slate-400">
                      {stmt.transactionCount} movimientos · {stmt.matchedCount} conciliados
                    </p>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      onDeleteRequest(stmt.id);
                    }}
                    className="shrink-0 rounded p-1 text-neutral-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    title="Eliminar extracto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

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

function TransactionsPageContent() {
  const [statements, setStatements] = useState<Array<{
    id: string;
    bankAccountId: string;
    periodStart: Date;
    transactionCount: number;
    matchedCount: number;
    bankAccount?: { bankName: string };
  }>>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [matches, setMatches] = useState<ReconciliationMatch[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [stmtId, setStmtId] = useState("");

  const [tab, setTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [categoryFilters, setCategoryFilters] = useState<TransactionCategory[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [drawerTxId, setDrawerTxId] = useState<string | null>(null);

  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, TransactionCategory>>({});
  const [matchStatusOverrides, setMatchStatusOverrides] = useState<Record<string, string>>({});

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/statements").then((r) => r.json()),
      fetch("/api/reconciliation").then((r) => r.json()),
      fetch("/api/invoices").then((r) => r.json()),
    ])
      .then(([stmts, matchesData, invoicesData]) => {
        setStatements(stmts || []);
        setMatches(matchesData?.matches || []);
        setInvoices(invoicesData?.invoices || invoicesData || []);
        if (stmts?.length > 0) {
          setStmtId(stmts[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!stmtId) return;
    setLoading(true);
    fetch(`/api/transactions?statementId=${stmtId}`)
      .then((r) => r.json())
      .then((data) => {
        setTransactions(data?.transactions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stmtId]);

  const updateTransactionCategory = async (id: string, cat: TransactionCategory) => {
    try {
      await fetch(`/api/transactions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userCategory: cat }),
      });
      setCategoryOverrides((prev) => ({ ...prev, [id]: cat }));
    } catch {
      toast.error("Error al actualizar la categoría");
    }
  };

  const handleConfirmMatch = async (txId: string) => {
    try {
      await fetch(`/api/transactions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: txId, matchStatus: "confirmed" }),
      });
      setMatchStatusOverrides((prev) => ({ ...prev, [txId]: "confirmed" }));
      setExpandedMatchId(null);
      toast.success("¡Match confirmado!");
    } catch {
      toast.error("Error al confirmar el match");
    }
  };

  const handleRejectMatch = async (txId: string) => {
    try {
      await fetch(`/api/transactions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: txId, matchStatus: "unmatched" }),
      });
      setMatchStatusOverrides((prev) => ({ ...prev, [txId]: "unmatched" }));
      setExpandedMatchId(null);
    } catch {
      toast.error("Error al rechazar el match");
    }
  };

  const allStmtTxs = useMemo(
    () => transactions,
    [transactions],
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

    if (tab !== "all") {
      txs = txs.filter((tx) => {
        const s = getEffectiveMatchStatus(tx);
        if (tab === "confirmed") return s === "confirmed";
        if (tab === "review") return s === "suggested";
        if (tab === "unmatched") return s === "unmatched";
        return true;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      txs = txs.filter((tx) => tx.description.toLowerCase().includes(q));
    }

    if (categoryFilters.length > 0) {
      txs = txs.filter((tx) => {
        const cat = categoryOverrides[tx.id] ?? tx.aiCategory;
        return categoryFilters.includes(cat);
      });
    }

    if (typeFilter !== "all") {
      txs = txs.filter((tx) => tx.type === typeFilter);
    }

    const sorted = [...txs];
    if (sortBy === "date") sorted.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
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

  const currentStmt = statements.find((s) => s.id === stmtId);
  const stmtSubtitle = currentStmt
    ? `Extracto ${currentStmt.bankAccount?.bankName ?? ""} — ${format(currentStmt.periodStart, "MMMM yyyy", { locale: es }).replace(/^\w/, (c) => c.toUpperCase())} · ${currentStmt.transactionCount} movimientos`
    : "";

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
      updateTransactionCategory(id, cat);
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

  const handleBulkCategorySelect = useCallback(
    async (cat: TransactionCategory) => {
      const count = selectedIds.size;
      try {
        await fetch(`/api/transactions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Array.from(selectedIds), updates: { userCategory: cat } }),
        });
        setCategoryOverrides((prev) => {
          const next = { ...prev };
          selectedIds.forEach((id) => { next[id] = cat; });
          return next;
        });
        setSelectedIds(new Set());
        setBulkModalOpen(false);
        toast.success(`Categoría actualizada en ${count} transacciones.`, { icon: "🏷️" });
      } catch {
        toast.error("Error al actualizar categorías");
      }
    },
    [selectedIds],
  );

  const hasMatchable = useMemo(
    () =>
      Array.from(selectedIds).some((id) => {
        const tx = transactions.find((t) => t.id === id);
        return tx && (matchStatusOverrides[id] ?? tx.matchStatus) === "suggested";
      }),
    [selectedIds, matchStatusOverrides, transactions],
  );

  const handleBulkConfirmMatches = useCallback(async () => {
    let confirmed = 0;
    for (const id of Array.from(selectedIds)) {
      const tx = transactions.find((t) => t.id === id);
      if (tx && (matchStatusOverrides[id] ?? tx.matchStatus) === "suggested") {
        try {
          await fetch(`/api/transactions`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, matchStatus: "confirmed" }),
          });
          setMatchStatusOverrides((prev) => ({ ...prev, [id]: "confirmed" }));
          confirmed++;
        } catch {}
      }
    }
    setSelectedIds(new Set());
    if (confirmed > 0) toast.success(`${confirmed} matches confirmados.`);
  }, [selectedIds, matchStatusOverrides, transactions]);

  const handleDeleteStatement = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/statements/${deleteConfirmId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      const remaining = statements.filter((s) => s.id !== deleteConfirmId);
      setStatements(remaining);
      if (stmtId === deleteConfirmId) {
        setStmtId(remaining[0]?.id ?? "");
        setTransactions([]);
      }
      setDeleteConfirmId(null);
      toast.success("Extracto eliminado");
    } catch {
      toast.error("Error al eliminar el extracto");
    } finally {
      setDeleting(false);
    }
  };

  const matchMap: Record<string, ReconciliationMatch | undefined> = {};
  matches.forEach((m) => {
    if (!matchMap[m.transactionId] || m.status === "suggested") {
      matchMap[m.transactionId] = m;
    }
  });

  const invoiceMap: Record<string, Invoice | undefined> = {};
  invoices.forEach((inv) => { invoiceMap[inv.id] = inv; });

  if (loading && transactions.length === 0) {
    return <PageLoader variant="table" />;
  }

  return (
    <div className="flex flex-col gap-0 pb-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
            Transacciones
          </h1>
          {stmtSubtitle && (
            <p className="mt-1 text-sm text-neutral-500">{stmtSubtitle}</p>
          )}
        </div>
        <StatementSelector
          value={stmtId}
          onChange={(id) => { setStmtId(id); setSelectedIds(new Set()); setExpandedMatchId(null); setSearch(""); setTab("all"); }}
          onDeleteRequest={setDeleteConfirmId}
          statements={statements}
        />
      </div>

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

      <div className="mt-4">
        <TransactionTable
          transactions={filteredTxs}
          categoryOverrides={categoryOverrides}
          matchStatusOverrides={matchStatusOverrides}
          selectedIds={selectedIds}
          expandedMatchId={expandedMatchId}
          matchMap={matchMap}
          invoiceMap={invoiceMap}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onCategoryOverride={handleCategoryOverride}
          onToggleMatchPanel={handleToggleMatchPanel}
          onConfirmMatch={handleConfirmMatch}
          onRejectMatch={handleRejectMatch}
          onOpenDrawer={(id) => setDrawerTxId(id)}
        />
      </div>

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

      <AnimatePresence>
        {bulkModalOpen && (
          <BulkCategoryModal
            count={selectedIds.size}
            onSelect={handleBulkCategorySelect}
            onClose={() => setBulkModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <TransactionDrawer
        transactionId={drawerTxId}
        transactions={transactions}
        categoryOverrides={categoryOverrides}
        matchStatusOverrides={matchStatusOverrides}
        invoiceMap={invoiceMap}
        onClose={() => setDrawerTxId(null)}
      />

      <SummaryFooter
        credits={totals.credits}
        debits={totals.debits}
        balance={totals.balance}
        filteredCount={filteredTxs.length}
        totalCount={allStmtTxs.length}
      />

      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => !deleting && setDeleteConfirmId(null)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-sm rounded-card border border-neutral-200 bg-white p-5 shadow-elevated dark:border-white/[0.08] dark:bg-[#1C2336]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-slate-100">Eliminar extracto</p>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-slate-400">
                    Se eliminarán todas las transacciones y conciliaciones asociadas. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={deleting}
                  className="flex-1 rounded-input border border-neutral-200 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.04]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteStatement}
                  disabled={deleting}
                  className="flex-1 rounded-input bg-red-500 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-60"
                >
                  {deleting ? "Eliminando…" : "Eliminar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TransactionsPage() {
  const loading = usePageLoader();
  if (loading) return <PageLoader variant="table" />;
  return <TransactionsPageContent />;
}
