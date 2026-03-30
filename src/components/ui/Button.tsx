"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "ai";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-500 text-white shadow-subtle hover:bg-primary-600 hover:shadow-card active:bg-primary-700 disabled:bg-primary-300",
  secondary:
    "border border-neutral-200 bg-white text-neutral-700 shadow-subtle hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100 disabled:text-neutral-400",
  ghost:
    "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200 disabled:text-neutral-400",
  danger:
    "bg-danger-500 text-white shadow-subtle hover:bg-danger-600 hover:shadow-card active:bg-danger-700 disabled:bg-danger-300",
  ai: "bg-ai-500 text-white shadow-subtle hover:bg-ai-600 hover:shadow-card active:bg-ai-700 disabled:bg-ai-300",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-input",
  md: "h-9 px-4 text-sm gap-2 rounded-input",
  lg: "h-11 px-6 text-base gap-2.5 rounded-input",
};

const iconSizes: Record<ButtonSize, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      className,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      asChild,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileTap={isDisabled ? {} : { scale: 0.97 }}
        transition={{ duration: 0.1 }}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-60",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {loading ? (
          <Loader2 className={cn("animate-spin shrink-0", iconSizes[size])} />
        ) : (
          leftIcon && (
            <span className={cn("shrink-0", iconSizes[size])}>{leftIcon}</span>
          )
        )}

        {children}

        {!loading && rightIcon && (
          <span className={cn("shrink-0", iconSizes[size])}>{rightIcon}</span>
        )}
      </motion.button>
    );
  },
);

Button.displayName = "Button";
