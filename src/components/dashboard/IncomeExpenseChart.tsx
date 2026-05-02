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
import { useDarkMode } from "@/hooks/useDarkMode";

function fmtY(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return `${value}`;
}

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
    <div className="rounded-card border border-neutral-200 bg-white p-3 shadow-elevated dark:border-white/[0.1] dark:bg-[#1C2336] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <p className="mb-2 text-xs font-semibold text-neutral-500 dark:text-slate-400">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-neutral-500 dark:text-slate-400">
            {entry.name === "income" ? "Ingresos" : "Egresos"}:
          </span>
          <span className="text-xs font-bold text-neutral-900 dark:text-slate-100">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface IncomeExpenseChartProps {
  data?: Array<{
    month: string;
    income: number;
    expense?: number;
  }>;
}

export function IncomeExpenseChart({ data = [] }: IncomeExpenseChartProps) {
  const [mounted, setMounted] = useState(false);
  const isDark = useDarkMode();

  useEffect(() => {
    setMounted(true);
  }, []);

  const gridColor  = isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9";
  const tickColor  = isDark ? "#64748b" : "#94A3B8";
  const cursorFill = isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC";

  const chartData = data.length > 0
    ? data.map((d) => ({
        month: d.month,
        income: d.income,
        expense: d.expense ?? Math.round(d.income * 0.7),
      }))
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-card border border-neutral-200 bg-white p-5 shadow-subtle dark:border-white/[0.07] dark:bg-[#161B27] dark:shadow-[0_4px_28px_rgba(0,0,0,0.4)]"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-base font-semibold text-neutral-900 dark:text-slate-100">
            Ingresos vs Egresos
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-slate-400">Últimos 6 meses</p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary-500" />
            <span className="text-xs text-neutral-500 dark:text-slate-400">Ingresos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#FB923C]" />
            <span className="text-xs text-neutral-500 dark:text-slate-400">Egresos</span>
          </div>
        </div>
      </div>

      {mounted ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData.length > 0 ? chartData : [{ month: "Sin datos", income: 0, expense: 0 }]}
            barGap={4}
            barCategoryGap="28%"
            margin={{ top: 4, right: 0, left: -8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: tickColor }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={fmtY}
              tick={{ fontSize: 11, fill: tickColor }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: cursorFill, radius: 4 }}
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
        <div className="h-[260px] animate-pulse rounded-lg bg-neutral-100 dark:bg-[#1C2336]" />
      )}
    </motion.div>
  );
}
