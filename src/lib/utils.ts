import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { TransactionCategory } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return formatted;
}

export function formatDate(date: Date): string {
  return format(date, "dd/MM/yyyy", { locale: es });
}

const categoryLabels: Record<TransactionCategory, string> = {
  pago_proveedor: "Pago a proveedor",
  cobro_cliente: "Cobro de cliente",
  impuesto: "Impuesto",
  comision_bancaria: "Comisión bancaria",
  transferencia_interna: "Transferencia interna",
  salario: "Salario",
  alquiler: "Alquiler",
  servicio: "Servicio",
  retencion: "Retención",
  percepcion: "Percepción",
  iva: "IVA",
  otros: "Otros",
};

export function getCategoryLabel(category: TransactionCategory): string {
  return categoryLabels[category] ?? category;
}

const categoryColors: Record<TransactionCategory, string> = {
  pago_proveedor: "bg-red-100 text-red-700",
  cobro_cliente: "bg-emerald-100 text-emerald-700",
  impuesto: "bg-orange-100 text-orange-700",
  comision_bancaria: "bg-neutral-100 text-neutral-700",
  transferencia_interna: "bg-blue-100 text-blue-700",
  salario: "bg-purple-100 text-purple-700",
  alquiler: "bg-amber-100 text-amber-700",
  servicio: "bg-cyan-100 text-cyan-700",
  retencion: "bg-rose-100 text-rose-700",
  percepcion: "bg-pink-100 text-pink-700",
  iva: "bg-yellow-100 text-yellow-700",
  otros: "bg-neutral-100 text-neutral-600",
};

export function getCategoryColor(category: TransactionCategory): string {
  return categoryColors[category] ?? "bg-neutral-100 text-neutral-600";
}

export function getConfidenceColor(confidence: number): string {
  if (confidence < 0.5) return "text-danger-500";
  if (confidence < 0.8) return "text-amber-500";
  return "text-success-500";
}

export function getStatusBadgeClasses(status: string): string {
  const statusMap: Record<string, string> = {
    // BankStatement statuses
    processing: "bg-blue-100 text-blue-700 border border-blue-200",
    classified: "bg-ai-100 text-ai-700 border border-ai-200",
    reviewing: "bg-amber-100 text-amber-700 border border-amber-200",
    reconciled: "bg-primary-100 text-primary-700 border border-primary-200",
    completed: "bg-success-100 text-success-700 border border-success-200",
    // Invoice statuses
    pending: "bg-neutral-100 text-neutral-700 border border-neutral-200",
    partially_matched: "bg-amber-100 text-amber-700 border border-amber-200",
    matched: "bg-success-100 text-success-700 border border-success-200",
    overdue: "bg-danger-100 text-danger-700 border border-danger-200",
    // Match statuses
    unmatched: "bg-neutral-100 text-neutral-600 border border-neutral-200",
    suggested: "bg-ai-100 text-ai-700 border border-ai-200",
    confirmed: "bg-success-100 text-success-700 border border-success-200",
    rejected: "bg-danger-100 text-danger-700 border border-danger-200",
  };
  return (
    statusMap[status] ??
    "bg-neutral-100 text-neutral-600 border border-neutral-200"
  );
}
