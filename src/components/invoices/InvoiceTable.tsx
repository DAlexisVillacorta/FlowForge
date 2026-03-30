"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Pencil, Trash2, Eye, FileText } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InvoiceTypeBadge } from "./InvoiceTypeBadge";
import type { Invoice } from "@/lib/types";

// ── Context menu ──────────────────────────────────────────────────────────────

interface MenuState {
  id: string;
  x: number;
  y: number;
}

function ContextMenu({
  menu,
  onView,
  onEdit,
  onDelete,
  onClose,
}: {
  menu: MenuState;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return createPortal(
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.12 }}
      className="fixed z-[200] min-w-[160px] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-elevated"
      style={{ top: menu.y, left: menu.x - 156 }}
    >
      {[
        {
          icon: Eye,
          label: "Ver detalle",
          action: () => { onView(menu.id); onClose(); },
          cls: "text-neutral-700",
        },
        {
          icon: Pencil,
          label: "Editar",
          action: () => { onEdit(menu.id); onClose(); },
          cls: "text-neutral-700",
        },
        {
          icon: Trash2,
          label: "Eliminar",
          action: () => { onDelete(menu.id); onClose(); },
          cls: "text-danger-600",
        },
      ].map(({ icon: Icon, label, action, cls }) => (
        <button
          key={label}
          onClick={action}
          className={cn(
            "flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-50",
            cls,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </motion.div>,
    document.body,
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
        <FileText className="h-6 w-6 text-neutral-400" />
      </div>
      <p className="text-sm font-semibold text-neutral-600">
        No hay facturas que coincidan
      </p>
      <p className="mt-1 text-xs text-neutral-400">
        Probá con otros filtros o cargá una nueva factura.
      </p>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

const HEADERS = [
  "Tipo",
  "Número",
  "Proveedor / Cliente",
  "Emisión",
  "Vencimiento",
  "Neto",
  "IVA",
  "Total",
  "Estado",
  "",
];

const GRID =
  "grid-cols-[52px_168px_196px_88px_88px_110px_90px_120px_120px_44px]";

function InvoiceRow({
  invoice,
  onView,
  onOpenMenu,
}: {
  invoice: Invoice;
  onView: (id: string) => void;
  onOpenMenu: (e: React.MouseEvent, id: string) => void;
}) {
  const isOverdue = invoice.status === "overdue";
  const today = new Date("2026-03-30");
  const duePassed = invoice.dueDate < today;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.18 } }}
      transition={{ duration: 0.22 }}
    >
      {/* Desktop */}
      <div
        className={cn(
          "hidden cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50/60 lg:grid",
          GRID,
        )}
        onClick={() => onView(invoice.id)}
      >
        <InvoiceTypeBadge type={invoice.type} />

        <code className="truncate font-mono text-xs text-neutral-700">
          {invoice.invoiceNumber}
        </code>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-800">
            {invoice.counterpartyName}
          </p>
          <p className="truncate font-mono text-[11px] text-neutral-400">
            {invoice.counterpartyCuit}
          </p>
        </div>

        <span className="text-xs text-neutral-600">
          {formatDate(invoice.issueDate)}
        </span>

        <span
          className={cn(
            "text-xs font-medium",
            isOverdue || duePassed ? "text-danger-600" : "text-neutral-600",
          )}
        >
          {formatDate(invoice.dueDate)}
        </span>

        <span className="font-mono text-xs text-neutral-600">
          {formatCurrency(invoice.netAmount)}
        </span>

        <span className="font-mono text-xs text-neutral-400">
          {invoice.ivaAmount ? formatCurrency(invoice.ivaAmount) : "—"}
        </span>

        <span className="font-mono text-xs font-bold text-neutral-800">
          {formatCurrency(invoice.totalAmount)}
        </span>

        <div onClick={(e) => e.stopPropagation()}>
          <StatusBadge status={invoice.status} size="sm" />
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => onOpenMenu(e, invoice.id)}
            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div
        className={cn(
          "flex cursor-pointer items-start justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-50/60 lg:hidden",
        )}
        onClick={() => onView(invoice.id)}
      >
        <div className="flex items-start gap-2.5">
          <InvoiceTypeBadge type={invoice.type} size="sm" />
          <div className="min-w-0">
            <code className="block truncate font-mono text-xs text-neutral-700">
              {invoice.invoiceNumber}
            </code>
            <p className="mt-0.5 truncate text-sm font-medium text-neutral-800">
              {invoice.counterpartyName}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={invoice.status} size="sm" />
              <span
                className={cn(
                  "text-[11px]",
                  isOverdue ? "font-semibold text-danger-600" : "text-neutral-400",
                )}
              >
                Vence {formatDate(invoice.dueDate)}
              </span>
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-sm font-bold text-neutral-800">
            {formatCurrency(invoice.totalAmount)}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-neutral-400">
            Neto {formatCurrency(invoice.netAmount)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── InvoiceTable ──────────────────────────────────────────────────────────────

interface InvoiceTableProps {
  invoices: Invoice[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function InvoiceTable({
  invoices,
  onView,
  onEdit,
  onDelete,
}: InvoiceTableProps) {
  const [menu, setMenu] = useState<MenuState | null>(null);

  const openMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu({ id, x: rect.right, y: rect.bottom + 4 });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-subtle">
      {/* Header — desktop only */}
      <div
        className={cn(
          "hidden gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 lg:grid",
          GRID,
        )}
      >
        {HEADERS.map((h, i) => (
          <span
            key={i}
            className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400"
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="overflow-x-auto">
        <div className="min-w-[960px] divide-y divide-neutral-50 lg:min-w-0">
          {invoices.length === 0 ? (
            <EmptyState />
          ) : (
            <AnimatePresence initial={false}>
              {invoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  onView={onView}
                  onOpenMenu={openMenu}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Context menu portal */}
      <AnimatePresence>
        {menu && (
          <ContextMenu
            menu={menu}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onClose={() => setMenu(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
