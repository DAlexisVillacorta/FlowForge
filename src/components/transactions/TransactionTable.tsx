"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MoreHorizontal, Pencil, CheckCircle2, XCircle, Sparkles,
  ChevronDown, ChevronRight, CheckSquare, Square,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Transaction, TransactionCategory, ReconciliationMatch, Invoice } from "@/lib/types";

// ── Tipos ─────────────────────────────────────────────────────────────────────

const ALL_CATEGORIES: TransactionCategory[] = [
  "pago_proveedor", "cobro_cliente", "impuesto", "comision_bancaria",
  "transferencia_interna", "salario", "alquiler", "servicio",
  "retencion", "percepcion", "iva", "otros",
];

// ── Mini confidence bar ────────────────────────────────────────────────────────

function MiniConfidenceBar({ value, muted }: { value: number; muted?: boolean }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.8 ? "bg-success-500" : value >= 0.5 ? "bg-amber-400" : "bg-danger-400";
  return (
    <div className={cn("flex items-center gap-1.5", muted && "opacity-40")}>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-neutral-100">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[11px] tabular-nums text-neutral-400">{pct}%</span>
    </div>
  );
}

// ── Category badge editor (inline) ────────────────────────────────────────────

function CategoryBadgeEditor({
  category,
  isOverridden,
  onSelect,
}: {
  category: TransactionCategory;
  isOverridden: boolean;
  onSelect: (cat: TransactionCategory) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="relative inline-flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        className={cn(
          "group flex items-center gap-1 rounded-full transition-all",
          "hover:ring-2 hover:ring-primary-300 hover:ring-offset-1",
          editing && "ring-2 ring-primary-400 ring-offset-1",
        )}
        title="Editar categoría"
      >
        <CategoryBadge category={category} size="sm" />
      </button>

      {isOverridden && (
        <span title="Categoría editada manualmente"><Pencil className="h-2.5 w-2.5 text-neutral-400" /></span>
      )}

      {editing && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setEditing(false); }} />
          <div className="absolute left-0 top-full z-50 mt-1 max-h-56 w-52 overflow-y-auto rounded-card border border-neutral-200 bg-white py-1 shadow-elevated">
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Seleccioná una categoría
            </p>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(cat);
                  setEditing(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-neutral-50",
                  cat === category && "bg-primary-50",
                )}
              >
                <CategoryBadge category={cat} size="sm" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Actions dropdown ──────────────────────────────────────────────────────────

function ActionsDropdown({
  onEditCategory,
  onViewMatch,
  onMarkReviewed,
}: {
  onEditCategory: () => void;
  onViewMatch: () => void;
  onMarkReviewed: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-card border border-neutral-200 bg-white py-1 shadow-elevated">
            {[
              { label: "Editar categoría", action: onEditCategory, icon: Pencil },
              { label: "Ver match", action: onViewMatch, icon: Sparkles },
              { label: "Marcar como revisado", action: onMarkReviewed, icon: CheckCircle2 },
            ].map(({ label, action, icon: Icon }) => (
              <button
                key={label}
                onClick={(e) => { e.stopPropagation(); action(); setOpen(false); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                <Icon className="h-3.5 w-3.5 text-neutral-400" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Match suggestion panel ────────────────────────────────────────────────────

function MatchSuggestionPanel({
  match,
  invoice,
  onConfirm,
  onReject,
}: {
  match: ReconciliationMatch;
  invoice: Invoice;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const [rejected, setRejected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (rejected) {
    return (
      <div className="mx-1 mb-1 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="mb-2 text-sm font-medium text-neutral-600">
          Buscar otra factura para conciliar:
        </p>
        <input
          autoFocus
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscá por nombre, número o monto…"
          className="h-9 w-full rounded-input border border-neutral-200 px-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15"
        />
        <p className="mt-2 text-xs text-neutral-400">
          Funcionalidad de búsqueda próximamente disponible.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-1 mb-1 rounded-xl border border-ai-200 bg-ai-50/40 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-ai-700">
        <Sparkles className="h-3.5 w-3.5" />
        La IA sugiere que este movimiento corresponde a:
      </p>

      {/* Invoice card */}
      <div className="mb-4 rounded-lg border border-white bg-white p-3 shadow-subtle">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900">{invoice.counterpartyName}</p>
            <p className="mt-0.5 font-mono text-xs text-neutral-500">{invoice.invoiceNumber}</p>
            <p className="mt-1 text-xs text-neutral-400">{formatDate(invoice.issueDate)}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-bold text-neutral-900">
              {formatCurrency(invoice.totalAmount)}
            </p>
            <p className="mt-1 text-[11px] text-neutral-400">
              IVA: {formatCurrency(invoice.ivaAmount)}
            </p>
          </div>
        </div>

        {/* Confidence */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-neutral-500">Confianza:</span>
          <MiniConfidenceBar value={match.confidenceScore} />
          <span className="text-[11px] font-medium capitalize text-ai-600">
            match {match.matchType}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onConfirm}
          className="flex items-center gap-1.5 rounded-input bg-success-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-success-700"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Confirmar match
        </button>
        <button
          onClick={() => { setRejected(true); onReject(); }}
          className="flex items-center gap-1.5 rounded-input border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          <XCircle className="h-3.5 w-3.5" />
          No es correcto
        </button>
      </div>
    </div>
  );
}

// ── Mobile card ───────────────────────────────────────────────────────────────

function TransactionMobileCard({
  tx,
  effectiveCategory,
  effectiveMatchStatus,
  isSelected,
  isOverridden,
  onToggleSelect,
  onCategoryOverride,
  onOpenDrawer,
}: {
  tx: Transaction;
  effectiveCategory: TransactionCategory;
  effectiveMatchStatus: string;
  isSelected: boolean;
  isOverridden: boolean;
  onToggleSelect: () => void;
  onCategoryOverride: (cat: TransactionCategory) => void;
  onOpenDrawer: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(
      "rounded-xl border bg-white p-4 transition-colors",
      isSelected ? "border-primary-300 bg-primary-50/30" : "border-neutral-200",
      effectiveMatchStatus === "suggested" && !isSelected && "border-ai-200 bg-ai-50/20",
    )}>
      {/* Row 1: Checkbox + Description + Monto */}
      <div className="flex items-start gap-3">
        <button onClick={(e) => { e.stopPropagation(); onToggleSelect(); }} className="mt-0.5 shrink-0">
          {isSelected
            ? <CheckSquare className="h-4 w-4 text-primary-600" />
            : <Square className="h-4 w-4 text-neutral-300" />
          }
        </button>

        <div className="min-w-0 flex-1" onClick={onOpenDrawer}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-neutral-900 line-clamp-2">{tx.description}</p>
            <span className={cn(
              "shrink-0 font-mono text-sm font-bold",
              tx.type === "credit" ? "text-success-600" : "text-danger-600",
            )}>
              {tx.type === "credit" ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-xs text-neutral-400">{formatDate(tx.transactionDate)}</span>
          </div>
        </div>

        <button
          onClick={() => setExpanded((o) => !o)}
          className="shrink-0 rounded-md p-1 text-neutral-400 hover:bg-neutral-100"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
        </button>
      </div>

      {/* Row 2: Badges */}
      <div className="mt-3 flex flex-wrap items-center gap-2 pl-7">
        <CategoryBadgeEditor
          category={effectiveCategory}
          isOverridden={isOverridden}
          onSelect={onCategoryOverride}
        />
        <StatusBadge
          status={effectiveMatchStatus as Parameters<typeof StatusBadge>[0]["status"]}
          size="sm"
        />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 border-t border-neutral-100 pt-3 pl-7">
          <MiniConfidenceBar value={tx.aiConfidence} muted={isOverridden} />
          <button
            onClick={onOpenDrawer}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Ver detalle completo
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── GRID cols helper ──────────────────────────────────────────────────────────
// 36px | 76px | 1fr | 130px | 176px | 112px | 124px | 44px

const GRID = "grid grid-cols-[36px_76px_1fr_130px_176px_112px_124px_44px]";

// ── Transaction Row (desktop) ─────────────────────────────────────────────────

function TransactionRow({
  tx,
  effectiveCategory,
  effectiveMatchStatus,
  isSelected,
  isExpanded,
  isOverridden,
  onToggleSelect,
  onCategoryOverride,
  onToggleMatchPanel,
  onOpenDrawer,
  match,
  invoice,
  onConfirmMatch,
  onRejectMatch,
}: {
  tx: Transaction;
  effectiveCategory: TransactionCategory;
  effectiveMatchStatus: string;
  isSelected: boolean;
  isExpanded: boolean;
  isOverridden: boolean;
  onToggleSelect: () => void;
  onCategoryOverride: (cat: TransactionCategory) => void;
  onToggleMatchPanel: () => void;
  onOpenDrawer: () => void;
  match?: ReconciliationMatch;
  invoice?: Invoice;
  onConfirmMatch: () => void;
  onRejectMatch: () => void;
}) {
  const isSuggested = effectiveMatchStatus === "suggested";

  const handleRowClick = () => {
    onOpenDrawer();
  };

  return (
    <>
      {/* Main row */}
      <div
        onClick={handleRowClick}
        className={cn(
          "group cursor-pointer border-b border-neutral-100 transition-colors last:border-0",
          GRID,
          "items-center gap-0 px-0",
          isSelected ? "bg-primary-50" : "hover:bg-neutral-50/80",
          isSuggested && !isSelected && "bg-ai-50/20",
          isExpanded && "bg-neutral-50",
        )}
      >
        {/* Checkbox */}
        <div className="flex items-center justify-center py-3 pl-3">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
            className="flex items-center justify-center"
          >
            {isSelected
              ? <CheckSquare className="h-4 w-4 text-primary-600" />
              : <Square className="h-4 w-4 text-neutral-300 group-hover:text-neutral-400" />
            }
          </button>
        </div>

        {/* Fecha */}
        <div className="py-3 pl-3">
          <span className="font-mono text-xs text-neutral-500">
            {formatDate(tx.transactionDate)}
          </span>
        </div>

        {/* Descripción */}
        <div className="min-w-0 py-3 pl-3 pr-4">
          <p className="truncate text-sm text-neutral-800" title={tx.description}>
            {tx.description}
          </p>
        </div>

        {/* Monto */}
        <div className="py-3 pr-3 text-right">
          <span className={cn(
            "font-mono text-sm font-semibold tabular-nums",
            tx.type === "credit" ? "text-success-600" : "text-danger-600",
          )}>
            {tx.type === "credit" ? "+" : "-"}
            {formatCurrency(Math.abs(tx.amount))}
          </span>
        </div>

        {/* Categoría (editable) */}
        <div className="py-3 pl-3" onClick={(e) => e.stopPropagation()}>
          <CategoryBadgeEditor
            category={effectiveCategory}
            isOverridden={isOverridden}
            onSelect={(cat) => onCategoryOverride(cat)}
          />
        </div>

        {/* Confianza IA */}
        <div className="py-3 pl-3">
          <MiniConfidenceBar value={tx.aiConfidence} muted={isOverridden} />
        </div>

        {/* Match status */}
        <div className="py-3 pl-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => isSuggested && onToggleMatchPanel()}
            className={cn(isSuggested && "hover:opacity-80")}
            title={isSuggested ? "Ver sugerencia de la IA" : undefined}
          >
            <StatusBadge
              status={effectiveMatchStatus as Parameters<typeof StatusBadge>[0]["status"]}
              size="sm"
            />
          </button>
        </div>

        {/* Acciones */}
        <div className="py-3 pr-2" onClick={(e) => e.stopPropagation()}>
          <ActionsDropdown
            onEditCategory={() => {/* handled inline in badge */}}
            onViewMatch={() => isSuggested && onToggleMatchPanel()}
            onMarkReviewed={() => {
              toast.success("Transacción marcada como revisada");
            }}
          />
        </div>
      </div>

      {/* Match suggestion panel */}
      <AnimatePresence>
        {isExpanded && isSuggested && match && invoice && (
          <motion.div
            key="match-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="overflow-hidden"
          >
            <MatchSuggestionPanel
              match={match}
              invoice={invoice}
              onConfirm={onConfirmMatch}
              onReject={onRejectMatch}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main table component ──────────────────────────────────────────────────────

export interface TransactionTableProps {
  transactions: Transaction[];
  categoryOverrides: Record<string, TransactionCategory>;
  matchStatusOverrides: Record<string, string>;
  selectedIds: Set<string>;
  expandedMatchId: string | null;
  matchMap: Record<string, ReconciliationMatch | undefined>;
  invoiceMap: Record<string, Invoice | undefined>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onCategoryOverride: (id: string, cat: TransactionCategory) => void;
  onToggleMatchPanel: (id: string) => void;
  onConfirmMatch: (txId: string) => void;
  onRejectMatch: (txId: string) => void;
  onOpenDrawer: (id: string) => void;
}

export function TransactionTable({
  transactions,
  categoryOverrides,
  matchStatusOverrides,
  selectedIds,
  expandedMatchId,
  matchMap,
  invoiceMap,
  onToggleSelect,
  onToggleSelectAll,
  onCategoryOverride,
  onToggleMatchPanel,
  onConfirmMatch,
  onRejectMatch,
  onOpenDrawer,
}: TransactionTableProps) {
  const allSelected = transactions.length > 0 && selectedIds.size === transactions.length;

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl">🔍</p>
        <p className="mt-3 text-base font-semibold text-neutral-700">No hay transacciones</p>
        <p className="mt-1 text-sm text-neutral-400">
          Probá con otros filtros o términos de búsqueda
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Desktop table ─── */}
      <div className="hidden overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-subtle lg:block">
        {/* Header */}
        <div className={cn(
          GRID,
          "items-center gap-0 border-b border-neutral-200 bg-neutral-50/80 px-0",
        )}>
          {/* Checkbox all */}
          <div className="flex items-center justify-center py-3 pl-3">
            <button onClick={onToggleSelectAll}>
              {allSelected
                ? <CheckSquare className="h-4 w-4 text-primary-600" />
                : <Square className="h-4 w-4 text-neutral-300 hover:text-neutral-400" />
              }
            </button>
          </div>
          {[
            "Fecha", "Descripción", "Monto", "Categoría", "Confianza IA", "Match", ""
          ].map((h, i) => (
            <div
              key={i}
              className={cn(
                "py-3 pl-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-500",
                i === 2 && "text-right pr-3 pl-0",
                i === 6 && "pr-2",
              )}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        <AnimatePresence initial={false}>
          {transactions.map((tx, index) => {
            const effectiveCategory = categoryOverrides[tx.id] ?? tx.aiCategory;
            const effectiveMatchStatus = matchStatusOverrides[tx.id] ?? tx.matchStatus;
            const isOverridden = Boolean(categoryOverrides[tx.id]);
            const match = matchMap[tx.id];
            const invoice = match ? invoiceMap[match.invoiceId] : undefined;

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.018, duration: 0.2 }}
              >
                <TransactionRow
                  tx={tx}
                  effectiveCategory={effectiveCategory}
                  effectiveMatchStatus={effectiveMatchStatus}
                  isSelected={selectedIds.has(tx.id)}
                  isExpanded={expandedMatchId === tx.id}
                  isOverridden={isOverridden}
                  onToggleSelect={() => onToggleSelect(tx.id)}
                  onCategoryOverride={(cat) => onCategoryOverride(tx.id, cat)}
                  onToggleMatchPanel={() => onToggleMatchPanel(tx.id)}
                  onOpenDrawer={() => onOpenDrawer(tx.id)}
                  match={match}
                  invoice={invoice}
                  onConfirmMatch={() => onConfirmMatch(tx.id)}
                  onRejectMatch={() => onRejectMatch(tx.id)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Mobile cards ─── */}
      <div className="space-y-3 lg:hidden">
        <AnimatePresence initial={false}>
          {transactions.map((tx, index) => {
            const effectiveCategory = categoryOverrides[tx.id] ?? tx.aiCategory;
            const effectiveMatchStatus = matchStatusOverrides[tx.id] ?? tx.matchStatus;
            const isOverridden = Boolean(categoryOverrides[tx.id]);

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.02, duration: 0.22 }}
              >
                <TransactionMobileCard
                  tx={tx}
                  effectiveCategory={effectiveCategory}
                  effectiveMatchStatus={effectiveMatchStatus}
                  isSelected={selectedIds.has(tx.id)}
                  isOverridden={isOverridden}
                  onToggleSelect={() => onToggleSelect(tx.id)}
                  onCategoryOverride={(cat) => onCategoryOverride(tx.id, cat)}
                  onOpenDrawer={() => onOpenDrawer(tx.id)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
