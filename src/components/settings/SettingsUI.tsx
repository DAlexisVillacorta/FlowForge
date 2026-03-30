"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// ── Input / Select class strings ──────────────────────────────────────────────

export const inputCls =
  "h-9 w-full rounded-input border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15 disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed";

export const selectCls =
  "h-9 w-full rounded-input border border-neutral-200 bg-white px-2.5 text-sm text-neutral-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15";

// ── SettingsSection ───────────────────────────────────────────────────────────

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function SettingsSection({
  title,
  description,
  children,
  action,
}: SettingsSectionProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-subtle">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-base font-bold text-neutral-900">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── SettingsField ─────────────────────────────────────────────────────────────

interface SettingsFieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function SettingsField({
  label,
  hint,
  required,
  children,
}: SettingsFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="ml-0.5 text-danger-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-3",
        disabled && "opacity-50",
      )}
    >
      <div>
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-primary-600" : "bg-neutral-200",
          disabled && "cursor-not-allowed",
        )}
      >
        <motion.span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 700, damping: 35 }}
        />
      </button>
    </div>
  );
}

// ── SaveButton ────────────────────────────────────────────────────────────────

interface SaveButtonProps {
  onClick: () => void;
  label?: string;
}

export function SaveButton({ onClick, label = "Guardar cambios" }: SaveButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-input bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 active:scale-[0.98]"
    >
      {label}
    </button>
  );
}
