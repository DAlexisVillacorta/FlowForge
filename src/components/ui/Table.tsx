"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type PaginationState,
} from "@tanstack/react-table";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SkeletonRow } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface DataTableEmptyState {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  /** Habilita ordenamiento por columna */
  sorting?: boolean;
  /** Muestra input de búsqueda global */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Filas seleccionables con checkbox */
  selectable?: boolean;
  onSelectionChange?: (rows: TData[]) => void;
  /** Estado vacío personalizado */
  emptyState?: DataTableEmptyState;
  /** Carga con skeleton rows */
  isLoading?: boolean;
  skeletonRows?: number;
  /** Paginación */
  pagination?: boolean;
  pageSize?: number;
  resultLabel?: string;
  className?: string;
  onRowClick?: (row: TData) => void;
}

// ── Checkbox interno ───────────────────────────────────────────────────────────

function TableCheckbox({
  checked,
  indeterminate,
  onChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  "aria-label"?: string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate;
      }}
      onChange={onChange}
      aria-label={ariaLabel}
      className={cn(
        "h-4 w-4 rounded border-neutral-300 text-primary-600 transition-colors",
        "cursor-pointer accent-primary-600",
        "focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1",
      )}
    />
  );
}

// ── Sorting icon ──────────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  if (dir === "asc") return <ChevronUp className="h-3.5 w-3.5 text-primary-600" />;
  if (dir === "desc") return <ChevronDown className="h-3.5 w-3.5 text-primary-600" />;
  return <ChevronsUpDown className="h-3.5 w-3.5 text-neutral-300" />;
}

// ── Componente principal ───────────────────────────────────────────────────────

export function DataTable<TData>({
  data,
  columns,
  sorting: enableSorting = true,
  searchable = false,
  searchPlaceholder = "Buscar…",
  selectable = false,
  onSelectionChange,
  emptyState,
  isLoading = false,
  skeletonRows = 6,
  pagination: enablePagination = true,
  pageSize: initialPageSize = 20,
  resultLabel = "resultados",
  className,
  onRowClick,
}: DataTableProps<TData>) {
  const [sortingState, setSortingState] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  // Columna de selección
  const selectionColumn: ColumnDef<TData, unknown> = useMemo(() => ({
    id: "_select",
    size: 40,
    enableSorting: false,
    header: ({ table }) => (
      <TableCheckbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        aria-label="Seleccionar todos"
      />
    ),
    cell: ({ row }) => (
      <TableCheckbox
        checked={row.getIsSelected()}
        indeterminate={row.getIsSomeSelected()}
        onChange={row.getToggleSelectedHandler()}
        aria-label="Seleccionar fila"
      />
    ),
  }), []);

  const tableColumns = useMemo(
    () => (selectable ? [selectionColumn, ...columns] : columns),
    [selectable, selectionColumn, columns],
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting: sortingState,
      globalFilter,
      rowSelection,
      pagination: paginationState,
    },
    enableRowSelection: selectable,
    onSortingChange: setSortingState,
    onGlobalFilterChange: (val) => {
      setGlobalFilter(val);
      setPaginationState((p) => ({ ...p, pageIndex: 0 }));
    },
    onRowSelectionChange: (updater) => {
      setRowSelection((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (onSelectionChange) {
          const selectedRows = table
            .getRowModel()
            .rows.filter((r) => next[r.id])
            .map((r) => r.original);
          onSelectionChange(selectedRows);
        }
        return next;
      });
    },
    onPaginationChange: setPaginationState,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSorting,
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const from = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalFiltered);

  const colCount = table.getAllColumns().length;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Barra de búsqueda */}
      {searchable && (
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              "h-9 w-full rounded-input border border-neutral-200 bg-white pl-9 pr-3 text-sm",
              "outline-none transition-all placeholder:text-neutral-400",
              "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
            )}
          />
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-card border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-neutral-200">
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                        className={cn(
                          "sticky top-0 z-10 bg-white/95 backdrop-blur-sm",
                          "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500",
                          "border-b border-neutral-200",
                          canSort && "cursor-pointer select-none hover:bg-neutral-50",
                        )}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center gap-1.5">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {canSort && <SortIcon dir={sorted} />}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody>
              {isLoading ? (
                Array.from({ length: skeletonRows }).map((_, i) => (
                  <SkeletonRow key={i} columns={colCount} />
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={colCount}>
                    <EmptyState
                      icon={emptyState?.icon ?? <Inbox />}
                      title={emptyState?.title ?? "Sin resultados"}
                      description={
                        emptyState?.description ??
                        (globalFilter
                          ? `No encontramos resultados para "${globalFilter}"`
                          : "No hay datos para mostrar")
                      }
                      action={emptyState?.action}
                      compact
                    />
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-selected={row.getIsSelected()}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={cn(
                      "border-b border-neutral-100 transition-colors last:border-0",
                      "data-[selected=true]:bg-primary-50/40",
                      onRowClick && "cursor-pointer",
                      "hover:bg-neutral-50",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {enablePagination && !isLoading && totalFiltered > 0 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">
            Mostrando{" "}
            <span className="font-medium text-neutral-700">{from}–{to}</span>{" "}
            de{" "}
            <span className="font-medium text-neutral-700">{totalFiltered}</span>{" "}
            {resultLabel}
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
            >
              Anterior
            </Button>

            {/* Indicador de página */}
            <span className="px-2 text-xs text-neutral-500">
              {pageIndex + 1} / {table.getPageCount()}
            </span>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Resumen de selección */}
      {selectable && Object.keys(rowSelection).length > 0 && (
        <div className="flex items-center gap-3 rounded-input border border-primary-200 bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-primary-700">
            {Object.keys(rowSelection).length} seleccionados
          </span>
          <button
            onClick={() => setRowSelection({})}
            className="text-xs text-primary-600 underline hover:text-primary-800"
          >
            Limpiar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Helper: celda de monto (font-mono, alineada derecha, verde/rojo) ──────────

interface AmountCellProps {
  amount: number;
  type?: "credit" | "debit";
}

export function AmountCell({ amount, type }: AmountCellProps) {
  const isCredit = type === "credit" || amount > 0;
  const formatted = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));

  return (
    <span
      className={cn(
        "block font-mono text-sm tabular-nums",
        isCredit ? "text-success-600" : "text-danger-600",
      )}
    >
      {isCredit ? "+" : "−"}
      {formatted}
    </span>
  );
}
