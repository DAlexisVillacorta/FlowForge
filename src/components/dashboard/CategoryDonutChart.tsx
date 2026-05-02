"use client";

import { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";
import { motion } from "framer-motion";
import { formatCurrency, getCategoryLabel } from "@/lib/utils";
import type { TransactionCategory } from "@/lib/types";
import { useDarkMode } from "@/hooks/useDarkMode";

const CATEGORY_COLORS: Record<string, string> = {
  salario: "#8B5CF6",
  pago_proveedor: "#F97316",
  alquiler: "#F59E0B",
  transferencia_interna: "#3B82F6",
  iva: "#EAB308",
  servicio: "#06B6D4",
  retencion: "#EC4899",
  comision_bancaria: "#94A3B8",
  percepcion: "#D946EF",
  impuesto: "#EF4444",
  cobro_cliente: "#10B981",
  otros: "#9CA3AF",
};

function getCategoryChartColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "#9CA3AF";
}

interface DonutPayloadItem {
  name: string;
  value: number;
}

interface DonutTooltipProps {
  active?: boolean;
  payload?: DonutPayloadItem[];
}

function CustomTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-card border border-neutral-200 bg-white px-3 py-2.5 shadow-elevated dark:border-white/[0.1] dark:bg-[#1C2336] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <p className="text-xs font-medium text-neutral-500 dark:text-slate-400">
        {getCategoryLabel(name as TransactionCategory)}
      </p>
      <p className="mt-0.5 text-sm font-bold text-neutral-900 dark:text-slate-100">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function fmtShort(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}k`;
  return formatCurrency(amount);
}

interface CategoryDonutChartProps {
  data?: Array<{
    category: string;
    amount: number;
    count: number;
    percentage?: number;
  }>;
}

export function CategoryDonutChart({ data = [] }: CategoryDonutChartProps) {
  const [mounted, setMounted] = useState(false);
  const isDark = useDarkMode();

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    return [...data]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [data]);

  const total = chartData.reduce((sum, c) => sum + c.amount, 0);

  const chartDataWithPercentage = chartData.map((c) => ({
    ...c,
    percentage: total > 0 ? (c.amount / total) * 100 : 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col rounded-card border border-neutral-200 bg-white p-5 shadow-subtle dark:border-white/[0.07] dark:bg-[#161B27] dark:shadow-[0_4px_28px_rgba(0,0,0,0.4)]"
    >
      <div className="mb-4">
        <h2 className="font-heading text-base font-semibold text-neutral-900 dark:text-slate-100">
          Distribución por categoría
        </h2>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-slate-400">Egresos</p>
      </div>

      {mounted ? (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartDataWithPercentage.length > 0 ? chartDataWithPercentage : [{ category: "Sin datos", amount: 1 }]}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={2}
              dataKey="amount"
              nameKey="category"
              strokeWidth={0}
            >
              {chartDataWithPercentage.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={getCategoryChartColor(entry.category)}
                />
              ))}

              <Label
                content={({ viewBox }) => {
                  const { cx, cy } = viewBox as { cx: number; cy: number };
                  return (
                    <g>
                      <text
                        x={cx}
                        y={cy - 9}
                        textAnchor="middle"
                        fill={isDark ? "#e2e8f0" : "#111827"}
                        fontSize={15}
                        fontWeight={700}
                        fontFamily="inherit"
                      >
                        {chartDataWithPercentage.length > 0 ? fmtShort(total) : "$0"}
                      </text>
                      <text
                        x={cx}
                        y={cy + 11}
                        textAnchor="middle"
                        fill={isDark ? "#64748b" : "#94A3B8"}
                        fontSize={11}
                        fontFamily="inherit"
                      >
                        Total
                      </text>
                    </g>
                  );
                }}
              />
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[200px] items-center justify-center">
          <div className="h-[180px] w-[180px] animate-pulse rounded-full border-[28px] border-neutral-100" />
        </div>
      )}

      <div className="mt-4 space-y-2">
        {chartDataWithPercentage.map((entry) => (
          <div
            key={entry.category}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: getCategoryChartColor(entry.category),
                }}
              />
              <span className="truncate text-xs text-neutral-600 dark:text-slate-400">
                {getCategoryLabel(entry.category as TransactionCategory)}
              </span>
            </div>
            <span className="shrink-0 text-xs font-semibold text-neutral-800 dark:text-slate-300">
              {entry.percentage?.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
