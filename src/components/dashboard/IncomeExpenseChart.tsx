"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { mockMonthlyTrend } from "@/lib/mock-data";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtY(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return `${value}`;
}

// ── Tooltip custom ────────────────────────────────────────────────────────────

interface BarEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: BarEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-card border border-neutral-200 bg-white p-3 shadow-elevated">
      <p className="mb-2 text-xs font-semibold text-neutral-500">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-neutral-500">
            {entry.name === "income" ? "Ingresos" : "Egresos"}:
          </span>
          <span className="text-xs font-bold text-neutral-900">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Chart ─────────────────────────────────────────────────────────────────────

export function IncomeExpenseChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-card border border-neutral-200 bg-white p-5 shadow-subtle"
    >
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-base font-semibold text-neutral-900">
            Ingresos vs Egresos
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">Últimos 6 meses</p>
        </div>

        {/* Leyenda */}
        <div className="flex shrink-0 items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary-500" />
            <span className="text-xs text-neutral-500">Ingresos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#FB923C]" />
            <span className="text-xs text-neutral-500">Egresos</span>
          </div>
        </div>
      </div>

      {/* Chart area */}
      {mounted ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={mockMonthlyTrend}
            barGap={4}
            barCategoryGap="28%"
            margin={{ top: 4, right: 0, left: -8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F1F5F9"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={fmtY}
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#F8FAFC", radius: 4 }}
            />
            <Bar
              dataKey="income"
              name="income"
              fill="#0D9488"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey="expense"
              name="expense"
              fill="#FB923C"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[260px] animate-pulse rounded-lg bg-neutral-100" />
      )}
    </motion.div>
  );
}
