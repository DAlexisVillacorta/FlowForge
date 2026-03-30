"use client";

import { cn, formatCurrency } from "@/lib/utils";

interface SummaryFooterProps {
  credits: number;
  debits: number;
  balance: number;
  filteredCount: number;
  totalCount: number;
}

export function SummaryFooter({
  credits,
  debits,
  balance,
  filteredCount,
  totalCount,
}: SummaryFooterProps) {
  return (
    <div className="sticky bottom-0 z-10 border-t border-neutral-200 bg-white/95 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span className="text-xs text-neutral-400">
          Mostrando{" "}
          <span className="font-semibold text-neutral-700">{filteredCount}</span>{" "}
          de{" "}
          <span className="font-semibold text-neutral-700">{totalCount}</span>{" "}
          movimientos
        </span>

        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Créditos</span>
            <span className="font-mono text-sm font-semibold text-success-600">
              +{formatCurrency(credits)}
            </span>
          </div>

          <div className="h-4 w-px bg-neutral-200" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Débitos</span>
            <span className="font-mono text-sm font-semibold text-danger-600">
              -{formatCurrency(debits)}
            </span>
          </div>

          <div className="h-4 w-px bg-neutral-200" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Balance</span>
            <span
              className={cn(
                "font-mono text-sm font-bold",
                balance >= 0 ? "text-success-600" : "text-danger-600",
              )}
            >
              {balance >= 0 ? "+" : ""}
              {formatCurrency(balance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
