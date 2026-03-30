"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "ai";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-neutral-100 text-neutral-700 border-neutral-200",
  success: "bg-success-50 text-success-700 border-success-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-danger-50 text-danger-700 border-danger-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  ai: "bg-ai-50 text-ai-700 border-ai-200",
};

const dotStyles: Record<BadgeVariant, string> = {
  default: "bg-neutral-400",
  success: "bg-success-500",
  warning: "bg-amber-500",
  danger: "bg-danger-500",
  info: "bg-blue-500",
  ai: "bg-ai-500",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

export function Badge({
  variant = "default",
  size = "md",
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full leading-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "rounded-full shrink-0",
            dotStyles[variant],
            size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
          )}
        />
      )}
      {children}
    </span>
  );
}
