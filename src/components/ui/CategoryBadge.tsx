"use client";

import { useState } from "react";
import {
  Truck,
  ArrowDownLeft,
  Landmark,
  Building2,
  User,
  Zap,
  Shield,
  ShieldCheck,
  Percent,
  HelpCircle,
  Home,
} from "lucide-react";
import { cn, getCategoryLabel } from "@/lib/utils";
import type { TransactionCategory } from "@/lib/types";

interface CategoryConfig {
  icon: React.ElementType;
  bg: string;
  text: string;
  border: string;
}

const categoryConfig: Record<TransactionCategory, CategoryConfig> = {
  pago_proveedor: {
    icon: Truck,
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  cobro_cliente: {
    icon: ArrowDownLeft,
    bg: "bg-success-50",
    text: "text-success-700",
    border: "border-success-200",
  },
  impuesto: {
    icon: Landmark,
    bg: "bg-danger-50",
    text: "text-danger-700",
    border: "border-danger-200",
  },
  comision_bancaria: {
    icon: Building2,
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    border: "border-neutral-200",
  },
  salario: {
    icon: User,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  alquiler: {
    icon: Home,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  servicio: {
    icon: Zap,
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
  },
  retencion: {
    icon: Shield,
    bg: "bg-ai-50",
    text: "text-ai-700",
    border: "border-ai-200",
  },
  percepcion: {
    icon: ShieldCheck,
    bg: "bg-ai-50",
    text: "text-ai-700",
    border: "border-ai-200",
  },
  iva: {
    icon: Percent,
    bg: "bg-accent-50",
    text: "text-accent-700",
    border: "border-accent-200",
  },
  transferencia_interna: {
    icon: ArrowDownLeft,
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  otros: {
    icon: HelpCircle,
    bg: "bg-neutral-100",
    text: "text-neutral-500",
    border: "border-neutral-200",
  },
};

interface CategoryBadgeProps {
  category: TransactionCategory;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function CategoryBadge({
  category,
  size = "md",
  showLabel = true,
  className,
}: CategoryBadgeProps) {
  const [hovered, setHovered] = useState(false);
  const config = categoryConfig[category];
  const Icon = config.icon;
  const label = getCategoryLabel(category);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip (solo cuando showLabel=false y hover) */}
      {!showLabel && hovered && (
        <div className="absolute -top-8 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
          <div className="whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[11px] text-white">
            {label}
          </div>
        </div>
      )}

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
        <Icon
          className={cn("shrink-0", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")}
        />
        {showLabel && <span>{label}</span>}
      </span>
    </div>
  );
}
