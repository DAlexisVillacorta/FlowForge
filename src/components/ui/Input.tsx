"use client";

import { forwardRef, useState, useRef } from "react";
import { cn } from "@/lib/utils";

type InputVariant = "default" | "error" | "success";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  variant?: InputVariant;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  inputSize?: "sm" | "md" | "lg";
}

const variantStyles: Record<InputVariant, string> = {
  default:
    "border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 " +
    "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
  error:
    "border-danger-400 bg-white text-neutral-900 placeholder:text-neutral-400 " +
    "focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20",
  success:
    "border-success-400 bg-white text-neutral-900 placeholder:text-neutral-400 " +
    "focus:border-success-500 focus:ring-2 focus:ring-success-500/20",
};

const sizeStyles = {
  sm: "h-8 text-xs px-3",
  md: "h-9 text-sm px-3",
  lg: "h-11 text-base px-4",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = "default",
      inputSize = "md",
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightElement,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const resolvedVariant = errorMessage ? "error" : variant;
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-neutral-400">
              <span className="h-4 w-4 flex items-center justify-center">
                {leftIcon}
              </span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-input border outline-none transition-all duration-150",
              "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400",
              variantStyles[resolvedVariant],
              sizeStyles[inputSize],
              leftIcon && "pl-9",
              rightElement && "pr-9",
              className,
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {(helperText || errorMessage) && (
          <p
            className={cn(
              "text-xs",
              errorMessage ? "text-danger-600" : "text-neutral-500",
            )}
          >
            {errorMessage ?? helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

// ── InputCurrency ─────────────────────────────────────────────────────────────
// Formatea en ARS al perder el foco, edita como número al enfocar

interface InputCurrencyProps
  extends Omit<InputProps, "value" | "onChange" | "type"> {
  value?: number | null;
  onChange?: (value: number | null) => void;
}

export function InputCurrency({
  value,
  onChange,
  placeholder = "$ 0,00",
  inputSize = "md",
  ...props
}: InputCurrencyProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Valor mostrado: cuando tiene foco → número raw; cuando no → formateado
  const displayValue = (() => {
    if (value == null) return "";
    if (focused) return String(value).replace(".", ",");
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  })();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(raw);
    onChange?.(isNaN(parsed) ? null : parsed);
  }

  return (
    <Input
      ref={inputRef}
      value={displayValue}
      onChange={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      inputSize={inputSize}
      className="font-mono text-right"
      {...props}
    />
  );
}
