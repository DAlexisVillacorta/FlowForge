"use client";

import { cn } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

// ── Config ────────────────────────────────────────────────────────────────────

type InvoiceType = Invoice["type"];

const TYPE_CONFIG: Record<
  InvoiceType,
  { label: string; bg: string; text: string; border: string }
> = {
  factura_a: {
    label: "A",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  factura_b: {
    label: "B",
    bg: "bg-success-50",
    text: "text-success-700",
    border: "border-success-200",
  },
  factura_c: {
    label: "C",
    bg: "bg-ai-50",
    text: "text-ai-700",
    border: "border-ai-200",
  },
  nota_credito: {
    label: "NC",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  nota_debito: {
    label: "ND",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  recibo: {
    label: "R",
    bg: "bg-primary-50",
    text: "text-primary-700",
    border: "border-primary-200",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function InvoiceTypeBadge({
  type,
  size = "md",
}: {
  type: InvoiceType;
  size?: "sm" | "md";
}) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md border font-bold",
        cfg.bg,
        cfg.text,
        cfg.border,
        size === "sm"
          ? "h-6 min-w-[24px] px-1.5 text-[11px]"
          : "h-7 min-w-[28px] px-2 text-xs",
      )}
    >
      {cfg.label}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<InvoiceType, string> = {
  factura_a: "Factura A",
  factura_b: "Factura B",
  factura_c: "Factura C",
  nota_credito: "Nota de Crédito",
  nota_debito: "Nota de Débito",
  recibo: "Recibo",
};

export function getInvoiceTypeLabel(type: InvoiceType): string {
  return TYPE_LABELS[type] ?? type;
}
