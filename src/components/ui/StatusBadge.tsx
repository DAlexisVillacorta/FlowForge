"use client";

import { CheckCircle2, Clock, Eye, Sparkles, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusType =
  | "processing"
  | "classified"
  | "reviewing"
  | "reconciled"
  | "completed"
  | "pending"
  | "partially_matched"
  | "matched"
  | "overdue"
  | "unmatched"
  | "suggested"
  | "confirmed"
  | "rejected";

interface StatusConfig {
  label: string;
  icon: React.ElementType;
  bg: string;
  text: string;
  border: string;
  pulse?: boolean;
}

const statusConfig: Record<StatusType, StatusConfig> = {
  processing: {
    label: "Procesando",
    icon: Loader2,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    pulse: true,
  },
  classified: {
    label: "Clasificado",
    icon: Sparkles,
    bg: "bg-ai-50",
    text: "text-ai-700",
    border: "border-ai-200",
  },
  reviewing: {
    label: "En revisión",
    icon: Eye,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  reconciled: {
    label: "Conciliado",
    icon: CheckCircle2,
    bg: "bg-primary-50",
    text: "text-primary-700",
    border: "border-primary-200",
  },
  completed: {
    label: "Completado",
    icon: CheckCircle2,
    bg: "bg-success-50",
    text: "text-success-700",
    border: "border-success-200",
  },
  pending: {
    label: "Pendiente",
    icon: Clock,
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    border: "border-neutral-200",
  },
  partially_matched: {
    label: "Parcial",
    icon: Clock,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  matched: {
    label: "Conciliado",
    icon: CheckCircle2,
    bg: "bg-success-50",
    text: "text-success-700",
    border: "border-success-200",
  },
  overdue: {
    label: "Vencido",
    icon: XCircle,
    bg: "bg-danger-50",
    text: "text-danger-700",
    border: "border-danger-200",
  },
  unmatched: {
    label: "Sin match",
    icon: XCircle,
    bg: "bg-neutral-100",
    text: "text-neutral-500",
    border: "border-neutral-200",
  },
  suggested: {
    label: "IA sugirió",
    icon: Sparkles,
    bg: "bg-ai-50",
    text: "text-ai-700",
    border: "border-ai-200",
  },
  confirmed: {
    label: "Confirmado",
    icon: CheckCircle2,
    bg: "bg-success-50",
    text: "text-success-700",
    border: "border-success-200",
  },
  rejected: {
    label: "Rechazado",
    icon: XCircle,
    bg: "bg-danger-50",
    text: "text-danger-700",
    border: "border-danger-200",
  },
};

interface StatusBadgeProps {
  status: StatusType;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  size = "md",
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center border font-medium rounded-full",
        config.bg,
        config.text,
        config.border,
        size === "sm"
          ? "gap-1 px-1.5 py-0.5 text-[11px]"
          : "gap-1.5 px-2.5 py-1 text-xs",
        className,
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            "shrink-0",
            size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5",
            config.pulse && "animate-spin",
          )}
        />
      )}
      {config.label}
    </span>
  );
}
