"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { usePageLoader } from "@/hooks/usePageLoader";
import { PageLoader } from "@/components/ui/PageLoader";
import Link from "next/link";
import { ChevronDown, Trash2, AlertTriangle, Search, X, Sparkles, Loader2, FileText, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { Transaction, Invoice, ReconciliationMatch } from "@/lib/types";
import { ConfidenceMeter } from "@/components/ui/ConfidenceMeter";
import { SplitView } from "@/components/reconciliation/SplitView";
import { ReconciliationSummary } from "@/components/reconciliation/ReconciliationSummary";
import { ConfirmedMatchesList } from "@/components/reconciliation/ConfirmedMatchesList";
import { ManualMatchModal } from "@/components/reconciliation/ManualMatchModal";


function getAccountLabel(stmt: { bankAccount?: { bankName: string }; periodStart: Date; id: string }): string {
  const bank = stmt.bankAccount?.bankName ?? "Banco";
  const d = new Date(stmt.periodStart);
  const month = d.toLocaleString("es-AR", { month: "long" });
  return `${bank} — ${month.charAt(0).toUpperCase() + month.slice(1)} ${d.getFullYear()}`;
}

function StatementSelector({
  stmtId,
  onChange,
  onDeleteRequest,
  statements,
}: {
  stmtId: string;
  onChange: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  statements: Array<{
    id: string;
    bankAccount?: { bankName: string };
    periodStart: Date;
    transactionCount: number;
    matchedCount: number;
  }>;
}) {
  const [open, setOpen] = useState(false);

  const current = statements.find((s) => s.id === stmtId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-input border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-subtle transition-colors hover:border-neutral-300 dark:border-white/[0.08] dark:bg-[#1C2336] dark:text-slate-200 dark:hover:border-white/[0.15]"
      >
        <span>{current ? getAccountLabel(current) : "Seleccionar extracto"}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-neutral-400 transition-transform dark:text-slate-500",
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
          <div className="absolute right-0 top-full z-50 mt-1.5 max-h-72 w-72 overflow-y-auto rounded-card border border-neutral-200 bg-white py-1 shadow-elevated dark:border-white/[0.08] dark:bg-[#1C2336]">
            {statements.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "group flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-white/[0.04]",
                  stmtId === s.id && "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400",
                )}
              >
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => { onChange(s.id); setOpen(false); }}
                >
                  <p className="font-medium dark:text-slate-100">{getAccountLabel(s)}</p>
                  <p className="text-[11px] text-neutral-400 dark:text-slate-500">
                    {s.transactionCount} movimientos · {s.matchedCount} conciliados
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    onDeleteRequest(s.id);
                  }}
                  className="shrink-0 rounded p-1 text-neutral-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  title="Eliminar extracto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ReconciliationPageContent() {
  const [statements, setStatements] = useState<Array<{
    id: string;
    bankAccount?: { bankName: string };
    periodStart: Date;
    transactionCount: number;
    matchedCount: number;
  }>>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [matches, setMatches] = useState<ReconciliationMatch[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [stmtId, setStmtId] = useState("");
  const [txSearch, setTxSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [manualMatchTxId, setManualMatchTxId] = useState<string | null>(null);
  const [manualMatching, setManualMatching] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [confirmedMatchIds, setConfirmedMatchIds] = useState<Set<string>>(new Set());
  const [rejectedMatchIds, setRejectedMatchIds] = useState<Set<string>>(new Set());
  const [flashingMatchId, setFlashingMatchId] = useState<string | null>(null);

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
    setTxSearch("");
    setLoading(true);
    fetch(`/api/transactions?statementId=${stmtId}`)
      .then((r) => r.json())
      .then((data) => {
        setTransactions(data?.transactions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stmtId]);

  const invoiceMap = useMemo(() => {
    const map: Record<string, Invoice | undefined> = {};
    invoices.forEach((inv) => { map[inv.id] = inv; });
    return map;
  }, [invoices]);

  const txMap = useMemo(() => {
    const map: Record<string, Transaction | undefined> = {};
    transactions.forEach((tx) => { map[tx.id] = tx; });
    return map;
  }, [transactions]);

  const stmtTxs = useMemo(
    () => transactions.filter((tx) => tx.statementId === stmtId),
    [transactions, stmtId],
  );

  const initialConfirmedTxIds = useMemo(
    () =>
      new Set(
        stmtTxs
          .filter((tx) => tx.matchStatus === "confirmed")
          .map((tx) => tx.id),
      ),
    [stmtTxs],
  );

  const sessionConfirmedTxIds = useMemo(() => {
    const s = new Set<string>();
    confirmedMatchIds.forEach((mid) => {
      const m = matches.find((x) => x.id === mid);
      if (m) s.add(m.transactionId);
    });
    return s;
  }, [confirmedMatchIds, matches]);

  const pendingTxs = useMemo(
    () =>
      stmtTxs.filter(
        (tx) =>
          !initialConfirmedTxIds.has(tx.id) &&
          !sessionConfirmedTxIds.has(tx.id),
      ),
    [stmtTxs, initialConfirmedTxIds, sessionConfirmedTxIds],
  );

  const filteredPendingTxs = useMemo(() => {
    const q = txSearch.trim().toLowerCase();
    if (!q) return pendingTxs;
    return pendingTxs.filter((tx) => {
      if (tx.description.toLowerCase().includes(q)) return true;
      if (Math.abs(tx.amount).toFixed(2).includes(q)) return true;
      return false;
    });
  }, [pendingTxs, txSearch]);

  const suggestedMatches = useMemo(
    () =>
      matches.filter(
        (m) =>
          m.status === "suggested" &&
          !confirmedMatchIds.has(m.id) &&
          !rejectedMatchIds.has(m.id) &&
          !initialConfirmedTxIds.has(m.transactionId) &&
          !sessionConfirmedTxIds.has(m.transactionId),
      ),
    [confirmedMatchIds, rejectedMatchIds, initialConfirmedTxIds, sessionConfirmedTxIds, matches],
  );

  const matchByTxId = useMemo(() => {
    const map: Record<string, ReconciliationMatch | undefined> = {};
    suggestedMatches.forEach((m) => {
      map[m.transactionId] = m;
    });
    return map;
  }, [suggestedMatches]);

  const confirmedInvoiceIds = useMemo(() => {
    const ids = new Set<string>();
    matches.filter(
      (m) => m.status === "confirmed" || confirmedMatchIds.has(m.id),
    ).forEach((m) => ids.add(m.invoiceId));
    return ids;
  }, [confirmedMatchIds, matches]);

  const pendingInvoices = useMemo(
    () => invoices.filter((inv) => !confirmedInvoiceIds.has(inv.id)),
    [invoices, confirmedInvoiceIds],
  );

  const allConfirmedMatches = useMemo(
    () =>
      matches.filter(
        (m) => m.status === "confirmed" || confirmedMatchIds.has(m.id),
      ),
    [confirmedMatchIds, matches],
  );

  const avgConfidence = useMemo(() => {
    if (suggestedMatches.length === 0) return 0;
    return (
      suggestedMatches.reduce((sum, m) => sum + m.confidenceScore, 0) /
      suggestedMatches.length
    );
  }, [suggestedMatches]);

  const unmatchedTxCount = pendingTxs.filter(
    (tx) => !matchByTxId[tx.id],
  ).length;

  const suggestedInvoiceIds = new Set(suggestedMatches.map((m) => m.invoiceId));
  const unmatchedInvCount = pendingInvoices.filter(
    (inv) => !suggestedInvoiceIds.has(inv.id),
  ).length;

  const totalDifference = allConfirmedMatches.reduce((sum, m) => {
    const tx = txMap[m.transactionId];
    const inv = invoiceMap[m.invoiceId];
    if (!tx || !inv) return sum;
    return sum + Math.abs(Math.abs(tx.amount) - inv.totalAmount);
  }, 0);

  const totalMatchable = allConfirmedMatches.length + suggestedMatches.length;

  const handleConfirmMatch = useCallback(async (matchId: string) => {
    setFlashingMatchId(matchId);
    try {
      await fetch(`/api/reconciliation/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
    } catch {}
    setTimeout(() => {
      setConfirmedMatchIds((prev) => { const n = new Set(prev); n.add(matchId); return n; });
      setSelectedTxId(null);
      setFlashingMatchId(null);
      toast.success("¡Match confirmado! ✓", {
        style: {
          background: "#f0fdf4",
          color: "#166534",
          border: "1px solid #86efac",
        },
      });
    }, 750);
  }, []);

  const handleRejectMatch = useCallback(async (matchId: string) => {
    try {
      await fetch(`/api/reconciliation/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
    } catch {}
    setRejectedMatchIds((prev) => { const n = new Set(prev); n.add(matchId); return n; });
    setSelectedTxId(null);
    toast("Match rechazado", { icon: "✕" });
  }, []);

  const handleUndoMatch = useCallback(async (matchId: string) => {
    try {
      await fetch(`/api/reconciliation/${matchId}`, { method: "DELETE" });
    } catch {}
    setConfirmedMatchIds((prev) => {
      const next = new Set(prev);
      next.delete(matchId);
      return next;
    });
    toast("Match deshecho", { icon: "↩" });
  }, []);

  const handleManualMatch = async (invoiceId: string) => {
    if (!manualMatchTxId || manualMatching) return;
    setManualMatching(true);
    try {
      const createRes = await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: manualMatchTxId,
          invoiceId,
          matchType: "exact",
        }),
      });
      if (!createRes.ok) throw new Error();
      const newMatch = await createRes.json();

      // Confirm the freshly-created match (cascades tx.matchStatus + invoice.status)
      await fetch(`/api/reconciliation/${newMatch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });

      // Refresh matches and transactions
      const [matchesData, txData] = await Promise.all([
        fetch("/api/reconciliation").then((r) => r.json()),
        fetch(`/api/transactions?statementId=${stmtId}`).then((r) => r.json()),
      ]);
      setMatches(matchesData?.matches || []);
      setTransactions(txData?.transactions || []);
      setSelectedTxId(null);
      setManualMatchTxId(null);
      toast.success("Factura vinculada al movimiento");
    } catch {
      toast.error("Error al vincular la factura");
    } finally {
      setManualMatching(false);
    }
  };

  const handleRerunMatcher = async () => {
    if (!stmtId || rerunning) return;
    setRerunning(true);
    try {
      const res = await fetch("/api/reconciliation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementId: stmtId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      // Re-load matches + transactions so UI reflects the fresh suggestions
      const [matchesData, txData] = await Promise.all([
        fetch("/api/reconciliation").then((r) => r.json()),
        fetch(`/api/transactions?statementId=${stmtId}`).then((r) => r.json()),
      ]);
      setMatches(matchesData?.matches || []);
      setTransactions(txData?.transactions || []);
      setConfirmedMatchIds(new Set());
      setRejectedMatchIds(new Set());
      setSelectedTxId(null);

      const n = data?.suggested ?? 0;
      const invs = data?.invoicesAvailable ?? 0;
      if (invs === 0) {
        toast("No hay facturas pendientes para conciliar", { icon: "ℹ️" });
      } else if (n === 0) {
        toast("Sin nuevas sugerencias — la IA no encontró matches confiables", { icon: "🔍" });
      } else {
        toast.success(`${n} match${n !== 1 ? "es" : ""} sugerido${n !== 1 ? "s" : ""} por la IA`);
      }
    } catch {
      toast.error("Error al ejecutar el matcher");
    } finally {
      setRerunning(false);
    }
  };

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

  if (loading && transactions.length === 0) {
    return <PageLoader variant="table" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold text-neutral-900">
            Conciliación
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {statements.find((s) => s.id === stmtId) ? getAccountLabel(statements.find((s) => s.id === stmtId)!) : ""}
            {suggestedMatches.length > 0 && (
              <>
                {" · "}
                <span className="font-medium text-ai-600">
                  {suggestedMatches.length} match
                  {suggestedMatches.length !== 1 ? "es" : ""} pendiente
                  {suggestedMatches.length !== 1 ? "s" : ""} sugerido
                  {suggestedMatches.length !== 1 ? "s" : ""} por la IA
                </span>
              </>
            )}
            {allConfirmedMatches.length > 0 && (
              <>
                {" · "}
                <span className="text-success-600">
                  {allConfirmedMatches.length} confirmado
                  {allConfirmedMatches.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <StatementSelector stmtId={stmtId} onChange={setStmtId} onDeleteRequest={setDeleteConfirmId} statements={statements} />
          <div className="flex items-center gap-2">
            {/* Re-run AI matcher */}
            <button
              onClick={handleRerunMatcher}
              disabled={rerunning || !stmtId}
              title="Volver a ejecutar el matcher de IA sobre este extracto"
              className="flex h-[38px] items-center gap-1.5 rounded-input border border-ai-200 bg-ai-50 px-3 text-xs font-medium text-ai-700 transition-colors hover:bg-ai-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-ai-500/30 dark:bg-ai-500/10 dark:text-ai-300 dark:hover:bg-ai-500/20"
            >
              {rerunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>{rerunning ? "Analizando…" : "Re-analizar"}</span>
            </button>
            {/* Search filter */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar movimiento…"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="h-[38px] w-52 rounded-input border border-neutral-200 bg-white pl-8 pr-7 text-xs text-neutral-700 shadow-subtle placeholder:text-neutral-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-white/[0.08] dark:bg-[#1C2336] dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-primary-500"
              />
              {txSearch && (
                <button
                  onClick={() => setTxSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {/* Score promedio IA */}
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 shadow-subtle">
              <span className="text-xs text-neutral-500">Score promedio IA</span>
              <ConfidenceMeter
                confidence={avgConfidence}
                showLabel
                showIcon
                size="md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Empty state: no invoices in the system */}
      {invoices.length === 0 && stmtTxs.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
              <FileText className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                No hay facturas cargadas
              </p>
              <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300/90">
                La IA necesita facturas para sugerir conciliaciones. Cargá tus facturas y luego presioná <span className="font-semibold">Re-analizar</span>.
              </p>
            </div>
          </div>
          <Link
            href="/invoices"
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-input bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700 sm:self-auto"
          >
            Ir a Facturas
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Helper hint when invoices exist but no matches were suggested */}
      {invoices.length > 0 &&
        suggestedMatches.length === 0 &&
        allConfirmedMatches.length === 0 &&
        stmtTxs.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-ai-200 bg-ai-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-ai-500/30 dark:bg-ai-500/10">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ai-100 dark:bg-ai-500/20">
                <Sparkles className="h-4 w-4 text-ai-600 dark:text-ai-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ai-800 dark:text-ai-200">
                  La IA aún no encontró matches automáticos
                </p>
                <p className="mt-0.5 text-xs text-ai-700/90 dark:text-ai-300/90">
                  Probá ejecutar el análisis o vinculá manualmente seleccionando un movimiento.
                </p>
              </div>
            </div>
            <button
              onClick={handleRerunMatcher}
              disabled={rerunning}
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-input bg-ai-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-ai-700 disabled:opacity-50 sm:self-auto"
            >
              {rerunning ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {rerunning ? "Analizando…" : "Ejecutar análisis"}
            </button>
          </div>
        )}

      <SplitView
        pendingTxs={filteredPendingTxs}
        pendingInvoices={pendingInvoices}
        suggestedMatches={suggestedMatches}
        flashingMatchId={flashingMatchId}
        selectedTxId={selectedTxId}
        onSelectTx={setSelectedTxId}
        onConfirmMatch={handleConfirmMatch}
        onRejectMatch={handleRejectMatch}
        onManualMatch={() => selectedTxId && setManualMatchTxId(selectedTxId)}
        invoiceMap={invoiceMap}
        txMap={txMap}
        matchByTxId={matchByTxId}
      />

      <ReconciliationSummary
        confirmedCount={allConfirmedMatches.length}
        totalMatchable={totalMatchable}
        unmatchedTxCount={unmatchedTxCount}
        unmatchedInvCount={unmatchedInvCount}
        totalDifference={totalDifference}
      />

      <ConfirmedMatchesList
        matches={allConfirmedMatches}
        sessionConfirmedIds={confirmedMatchIds}
        txMap={txMap}
        invoiceMap={invoiceMap}
        onUndo={handleUndoMatch}
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

      {/* Manual invoice match modal */}
      <ManualMatchModal
        open={!!manualMatchTxId}
        tx={manualMatchTxId ? txMap[manualMatchTxId] ?? null : null}
        invoices={pendingInvoices}
        onClose={() => !manualMatching && setManualMatchTxId(null)}
        onSelect={handleManualMatch}
        matching={manualMatching}
      />
    </div>
  );
}

export default function ReconciliationPage() {
  const loading = usePageLoader();
  if (loading) return <PageLoader variant="table" />;
  return <ReconciliationPageContent />;
}
