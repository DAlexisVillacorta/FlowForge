"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type InvoiceTab = "all" | "pending" | "matched" | "overdue";

interface TabCounts {
  all: number;
  pending: number;
  matched: number;
  overdue: number;
}

export interface InvoiceFilterState {
  search: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

interface InvoiceFiltersProps {
  activeTab: InvoiceTab;
  onTabChange: (tab: InvoiceTab) => void;
  counts: TabCounts;
  filters: InvoiceFilterState;
  onFiltersChange: (f: Partial<InvoiceFilterState>) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

// ── Shared input cls ──────────────────────────────────────────────────────────

const inputCls =
  "h-9 rounded-input border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15";

// ── Component ─────────────────────────────────────────────────────────────────

export function InvoiceFilters({
  activeTab,
  onTabChange,
  counts,
  filters,
  onFiltersChange,
  showAdvanced,
  onToggleAdvanced,
}: InvoiceFiltersProps) {
  const tabs: { id: InvoiceTab; label: string; count: number }[] = [
    { id: "all", label: "Todas", count: counts.all },
    { id: "pending", label: "Pendientes", count: counts.pending },
    { id: "matched", label: "Matcheadas", count: counts.matched },
    { id: "overdue", label: "Vencidas", count: counts.overdue },
  ];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-subtle">
      {/* Tabs row */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-100 px-4 pt-3 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-t-md px-3.5 pb-3 pt-1.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-primary-600 text-primary-700"
                : "text-neutral-500 hover:text-neutral-700",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                activeTab === tab.id
                  ? "bg-primary-100 text-primary-700"
                  : "bg-neutral-100 text-neutral-500",
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search + filters row */}
      <div className="flex flex-wrap items-center gap-2 p-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className={inputCls + " w-full pl-8"}
            placeholder="Buscar por número, proveedor o CUIT…"
          />
        </div>

        {/* Type filter */}
        <select
          value={filters.type}
          onChange={(e) => onFiltersChange({ type: e.target.value })}
          className={inputCls + " w-auto"}
        >
          <option value="">Todos los tipos</option>
          <option value="factura_a">Factura A</option>
          <option value="factura_b">Factura B</option>
          <option value="factura_c">Factura C</option>
          <option value="nota_credito">Nota de Crédito</option>
          <option value="nota_debito">Nota de Débito</option>
          <option value="recibo">Recibo</option>
        </select>

        {/* Toggle advanced */}
        <button
          onClick={onToggleAdvanced}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-input border px-3 text-sm font-medium transition-colors",
            showAdvanced
              ? "border-primary-300 bg-primary-50 text-primary-700"
              : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 px-3 pb-3 pt-2.5">
          <span className="text-xs font-medium text-neutral-500">Fecha:</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
            className={inputCls + " w-auto"}
          />
          <span className="text-xs text-neutral-400">→</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
            className={inputCls + " w-auto"}
          />

          <span className="ml-2 text-xs font-medium text-neutral-500">
            Monto:
          </span>
          <input
            type="number"
            value={filters.amountMin}
            onChange={(e) => onFiltersChange({ amountMin: e.target.value })}
            className={inputCls + " w-32"}
            placeholder="Mín."
          />
          <span className="text-xs text-neutral-400">→</span>
          <input
            type="number"
            value={filters.amountMax}
            onChange={(e) => onFiltersChange({ amountMax: e.target.value })}
            className={inputCls + " w-32"}
            placeholder="Máx."
          />

          <button
            onClick={() =>
              onFiltersChange({
                dateFrom: "",
                dateTo: "",
                amountMin: "",
                amountMax: "",
              })
            }
            className="ml-auto text-xs font-medium text-neutral-400 hover:text-neutral-600"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
