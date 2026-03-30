"use client";

import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import type { TransactionCategory } from "@/lib/types";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type StatusTab = "all" | "confirmed" | "review" | "unmatched";
export type SortOption = "date" | "amount" | "confidence";
export type TypeFilter = "all" | "credit" | "debit";

interface Counts {
  all: number;
  confirmed: number;
  review: number;
  unmatched: number;
}

interface TransactionFiltersProps {
  activeTab: StatusTab;
  onTabChange: (tab: StatusTab) => void;
  counts: Counts;
  search: string;
  onSearchChange: (q: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  categoryFilters: TransactionCategory[];
  onCategoryFilterChange: (cats: TransactionCategory[]) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (t: TypeFilter) => void;
  onExport: () => void;
}

// ── Categorías disponibles ────────────────────────────────────────────────────

const ALL_CATEGORIES: TransactionCategory[] = [
  "pago_proveedor", "cobro_cliente", "impuesto", "comision_bancaria",
  "transferencia_interna", "salario", "alquiler", "servicio",
  "retencion", "percepcion", "iva", "otros",
];

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS: { key: StatusTab; label: string; color: string }[] = [
  { key: "all", label: "Todos", color: "" },
  { key: "confirmed", label: "Confirmados", color: "text-success-600" },
  { key: "review", label: "Por revisar", color: "text-amber-600" },
  { key: "unmatched", label: "Sin match", color: "text-neutral-500" },
];

// ── Filter dropdown ───────────────────────────────────────────────────────────

function FilterDropdown({
  categoryFilters,
  onCategoryFilterChange,
  typeFilter,
  onTypeFilterChange,
  activeCount,
  onReset,
}: {
  categoryFilters: TransactionCategory[];
  onCategoryFilterChange: (cats: TransactionCategory[]) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (t: TypeFilter) => void;
  activeCount: number;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleCategory = (cat: TransactionCategory) => {
    onCategoryFilterChange(
      categoryFilters.includes(cat)
        ? categoryFilters.filter((c) => c !== cat)
        : [...categoryFilters, cat],
    );
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-input border px-3 py-1.5 text-sm transition-colors",
          activeCount > 0
            ? "border-primary-400 bg-primary-50 text-primary-700"
            : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filtros
        {activeCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-80 rounded-card border border-neutral-200 bg-white p-4 shadow-elevated">
          {/* Tipo */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Tipo
            </p>
            <div className="flex gap-2">
              {(["all", "credit", "debit"] as TypeFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => onTypeFilterChange(t)}
                  className={cn(
                    "rounded-input border px-3 py-1 text-xs font-medium transition-colors",
                    typeFilter === t
                      ? "border-primary-400 bg-primary-50 text-primary-700"
                      : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
                  )}
                >
                  {t === "all" ? "Todos" : t === "credit" ? "Créditos" : "Débitos"}
                </button>
              ))}
            </div>
          </div>

          {/* Categorías */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Categoría
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    "rounded-full transition-all",
                    categoryFilters.includes(cat)
                      ? "ring-2 ring-primary-400 ring-offset-1"
                      : "opacity-70 hover:opacity-100",
                  )}
                >
                  <CategoryBadge category={cat} size="sm" />
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          {activeCount > 0 && (
            <button
              onClick={() => { onReset(); setOpen(false); }}
              className="mt-3 flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-3 w-3" />
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sort dropdown ─────────────────────────────────────────────────────────────

const SORT_LABELS: Record<SortOption, string> = {
  date: "Fecha",
  amount: "Monto",
  confidence: "Confianza IA",
};

function SortDropdown({
  sortBy,
  onChange,
}: {
  sortBy: SortOption;
  onChange: (s: SortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-input border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
      >
        <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" />
        {SORT_LABELS[sortBy]}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-44 rounded-card border border-neutral-200 bg-white py-1 shadow-elevated">
          {(["date", "amount", "confidence"] as SortOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                "flex w-full items-center px-3 py-2 text-sm transition-colors",
                sortBy === opt
                  ? "bg-primary-50 font-medium text-primary-700"
                  : "text-neutral-700 hover:bg-neutral-50",
              )}
            >
              {SORT_LABELS[opt]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TransactionFilters ────────────────────────────────────────────────────────

export function TransactionFilters({
  activeTab,
  onTabChange,
  counts,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  categoryFilters,
  onCategoryFilterChange,
  typeFilter,
  onTypeFilterChange,
  onExport,
}: TransactionFiltersProps) {
  const activeFilterCount =
    categoryFilters.length + (typeFilter !== "all" ? 1 : 0);

  return (
    <div className="sticky top-0 z-20 -mx-4 bg-white px-4 shadow-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {/* Row 1: Status tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-100 pb-0 pt-3 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none",
                activeTab === tab.key
                  ? "bg-primary-100 text-primary-700"
                  : "bg-neutral-100 text-neutral-500",
              )}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Row 2: Search + Filters + Sort + Export */}
      <div className="flex items-center gap-2 py-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por descripción…"
            className="h-8 w-full rounded-input border border-neutral-200 bg-neutral-50 pl-8 pr-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-500/15"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filtros */}
        <FilterDropdown
          categoryFilters={categoryFilters}
          onCategoryFilterChange={onCategoryFilterChange}
          typeFilter={typeFilter}
          onTypeFilterChange={onTypeFilterChange}
          activeCount={activeFilterCount}
          onReset={() => {
            onCategoryFilterChange([]);
            onTypeFilterChange("all");
          }}
        />

        {/* Sort */}
        <SortDropdown sortBy={sortBy} onChange={onSortChange} />

        {/* Export */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-input border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
        >
          <Download className="h-3.5 w-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>
    </div>
  );
}
