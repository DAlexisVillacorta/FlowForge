"use client";

import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-16 px-6",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-neutral-100 text-neutral-400",
            compact ? "h-12 w-12 mb-3 [&>svg]:h-5 [&>svg]:w-5" : "h-16 w-16 mb-4 [&>svg]:h-7 [&>svg]:w-7",
          )}
        >
          {icon}
        </div>
      )}

      <h3
        className={cn(
          "font-heading font-semibold text-neutral-800",
          compact ? "text-sm" : "text-base",
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            "mt-1.5 text-neutral-500 max-w-sm",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className={cn("flex items-center gap-3", compact ? "mt-4" : "mt-6")}>
          {action && (
            <Button
              variant={action.variant ?? "primary"}
              size={compact ? "sm" : "md"}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              size={compact ? "sm" : "md"}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
