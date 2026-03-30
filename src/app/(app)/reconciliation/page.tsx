"use client";

import { useState, useMemo, useCallback } from "react";
import { usePageLoader } from "@/hooks/usePageLoader";
import { PageLoader } from "@/components/ui/PageLoader";
import { ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  mockTransactions,
  mockStatements,
  mockBankAccounts,
  mockMatches,
  mockInvoices,
} from "@/lib/mock-data";
import type { Transaction, Invoice, ReconciliationMatch } from "@/lib/types";
import { ConfidenceMeter } from "@/components/ui/ConfidenceMeter";
import { SplitView } from "@/components/reconciliation/SplitView";
import { ReconciliationSummary } from "@/components/reconciliation/ReconciliationSummary";
import { ConfirmedMatchesList } from "@/components/reconciliation/ConfirmedMatchesList";

// ── Static maps (built once, outside component) ───────────────────────────────

const INVOICE_MAP: Record<string, Invoice | undefined> = {};
mockInvoices.forEach((inv) => { INVOICE_MAP[inv.id] = inv; });

const TX_MAP: Record<string, Transaction | undefined> = {};
mockTransactions.forEach((tx) => { TX_MAP[tx.id] = tx; });

// Synthetic match for tx-28 (has matchedInvoiceId in tx data but no mockMatch record)
const SYNTHETIC_MATCHES: ReconciliationMatch[] = [
  {
    id: "match-synth-1",
    transactionId: "tx-28",
    invoiceId: "inv-17",
    matchType: "exact",
    confidenceScore: 0.82,
    status: "suggested",
    createdAt: new Date("2026-03-30"),
  },
];

const ALL_MATCHES: ReconciliationMatch[] = [...mockMatches, ...SYNTHETIC_MATCHES];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAccountLabel(stmtId: string): string {
  const stmt = mockStatements.find((s) => s.id === stmtId);
  if (!stmt) return stmtId;
  const account = mockBankAccounts.find((a) => a.id === stmt.bankAccountId);
  const bank = account?.bankName ?? "Banco";
  const d = stmt.periodStart;
  const month = d.toLocaleString("es-AR", { month: "long" });
  return `${bank} — ${month.charAt(0).toUpperCase() + month.slice(1)} ${d.getFullYear()}`;
}

// ── Statement selector ────────────────────────────────────────────────────────

function StatementSelector({
  stmtId,
  onChange,
}: {
  stmtId: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-input border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-subtle transition-colors hover:border-neutral-300"
      >
        <span>{getAccountLabel(stmtId)}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-neutral-400 transition-transform",
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
          <div className="absolute left-0 top-full z-20 mt-1.5 min-w-[220px] rounded-card border border-neutral-200 bg-white py-1 shadow-elevated">
            {mockStatements.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onChange(s.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50",
                  stmtId === s.id && "bg-primary-50 text-primary-700",
                )}
              >
                <div>
                  <p className="font-medium">{getAccountLabel(s.id)}</p>
                  <p className="text-[11px] text-neutral-400">
                    {s.transactionCount} movimientos · {s.matchedCount}{" "}
                    conciliados
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function ReconciliationPageContent() {
  const [stmtId, setStmtId] = useState("stmt-1");
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [confirmedMatchIds, setConfirmedMatchIds] = useState<Set<string>>(
    new Set(),
  );
  const [rejectedMatchIds, setRejectedMatchIds] = useState<Set<string>>(
    new Set(),
  );
  const [flashingMatchId, setFlashingMatchId] = useState<string | null>(null);

  // ── Derived data ────────────────────────────────────────────────────────────

  // Transactions already confirmed in mock data
  const initialConfirmedTxIds = useMemo(
    () =>
      new Set(
        mockTransactions
          .filter(
            (tx) =>
              tx.statementId === stmtId && tx.matchStatus === "confirmed",
          )
          .map((tx) => tx.id),
      ),
    [stmtId],
  );

  // Tx IDs confirmed this session
  const sessionConfirmedTxIds = useMemo(() => {
    const s = new Set<string>();
    confirmedMatchIds.forEach((mid) => {
      const m = ALL_MATCHES.find((x) => x.id === mid);
      if (m) s.add(m.transactionId);
    });
    return s;
  }, [confirmedMatchIds]);

  // Pending transactions (not confirmed initially or in this session)
  const pendingTxs = useMemo(
    () =>
      mockTransactions.filter(
        (tx) =>
          tx.statementId === stmtId &&
          !initialConfirmedTxIds.has(tx.id) &&
          !sessionConfirmedTxIds.has(tx.id),
      ),
    [stmtId, initialConfirmedTxIds, sessionConfirmedTxIds],
  );

  // Active suggested matches (pending, not rejected, not confirmed)
  const suggestedMatches = useMemo(
    () =>
      ALL_MATCHES.filter(
        (m) =>
          m.status === "suggested" &&
          !confirmedMatchIds.has(m.id) &&
          !rejectedMatchIds.has(m.id) &&
          !initialConfirmedTxIds.has(m.transactionId) &&
          !sessionConfirmedTxIds.has(m.transactionId),
      ),
    [confirmedMatchIds, rejectedMatchIds, initialConfirmedTxIds, sessionConfirmedTxIds],
  );

  // Match lookup by tx id (only for pending suggested)
  const matchByTxId = useMemo(() => {
    const map: Record<string, ReconciliationMatch | undefined> = {};
    suggestedMatches.forEach((m) => {
      map[m.transactionId] = m;
    });
    return map;
  }, [suggestedMatches]);

  // Confirmed invoice IDs (initial + session)
  const confirmedInvoiceIds = useMemo(() => {
    const ids = new Set<string>();
    ALL_MATCHES.filter(
      (m) => m.status === "confirmed" || confirmedMatchIds.has(m.id),
    ).forEach((m) => ids.add(m.invoiceId));
    return ids;
  }, [confirmedMatchIds]);

  // Pending invoices
  const pendingInvoices = useMemo(
    () => mockInvoices.filter((inv) => !confirmedInvoiceIds.has(inv.id)),
    [confirmedInvoiceIds],
  );

  // All confirmed matches (initial + session)
  const allConfirmedMatches = useMemo(
    () =>
      ALL_MATCHES.filter(
        (m) => m.status === "confirmed" || confirmedMatchIds.has(m.id),
      ),
    [confirmedMatchIds],
  );

  // Average confidence of pending suggested matches
  const avgConfidence = useMemo(() => {
    if (suggestedMatches.length === 0) return 0;
    return (
      suggestedMatches.reduce((sum, m) => sum + m.confidenceScore, 0) /
      suggestedMatches.length
    );
  }, [suggestedMatches]);

  // Summary metrics
  const unmatchedTxCount = pendingTxs.filter(
    (tx) =>
      !matchByTxId[tx.id],
  ).length;

  const suggestedInvoiceIds = new Set(suggestedMatches.map((m) => m.invoiceId));
  const unmatchedInvCount = pendingInvoices.filter(
    (inv) => !suggestedInvoiceIds.has(inv.id),
  ).length;

  const totalDifference = allConfirmedMatches.reduce((sum, m) => {
    const tx = TX_MAP[m.transactionId];
    const inv = INVOICE_MAP[m.invoiceId];
    if (!tx || !inv) return sum;
    return sum + Math.abs(Math.abs(tx.amount) - inv.totalAmount);
  }, 0);

  const totalMatchable = allConfirmedMatches.length + suggestedMatches.length;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleConfirmMatch = useCallback((matchId: string) => {
    setFlashingMatchId(matchId);
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

  const handleRejectMatch = useCallback((matchId: string) => {
    setRejectedMatchIds((prev) => { const n = new Set(prev); n.add(matchId); return n; });
    setSelectedTxId(null);
    toast("Match rechazado", { icon: "✕" });
  }, []);

  const handleUndoMatch = useCallback((matchId: string) => {
    setConfirmedMatchIds((prev) => {
      const next = new Set(prev);
      next.delete(matchId);
      return next;
    });
    toast("Match deshecho", { icon: "↩" });
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold text-neutral-900">
            Conciliación
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {getAccountLabel(stmtId)}
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

        {/* Controls: statement selector + confidence meter */}
        <div className="flex shrink-0 flex-col items-end gap-3">
          <StatementSelector stmtId={stmtId} onChange={setStmtId} />
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

      {/* Split view — the main feature */}
      <SplitView
        pendingTxs={pendingTxs}
        pendingInvoices={pendingInvoices}
        suggestedMatches={suggestedMatches}
        flashingMatchId={flashingMatchId}
        selectedTxId={selectedTxId}
        onSelectTx={setSelectedTxId}
        onConfirmMatch={handleConfirmMatch}
        onRejectMatch={handleRejectMatch}
        invoiceMap={INVOICE_MAP}
        txMap={TX_MAP}
        matchByTxId={matchByTxId}
      />

      {/* Reconciliation summary */}
      <ReconciliationSummary
        confirmedCount={allConfirmedMatches.length}
        totalMatchable={totalMatchable}
        unmatchedTxCount={unmatchedTxCount}
        unmatchedInvCount={unmatchedInvCount}
        totalDifference={totalDifference}
      />

      {/* Confirmed matches — collapsible section */}
      <ConfirmedMatchesList
        matches={allConfirmedMatches}
        sessionConfirmedIds={confirmedMatchIds}
        txMap={TX_MAP}
        invoiceMap={INVOICE_MAP}
        onUndo={handleUndoMatch}
      />
    </div>
  );
}

export default function ReconciliationPage() {
  const loading = usePageLoader();
  if (loading) return <PageLoader variant="table" />;
  return <ReconciliationPageContent />;
}
