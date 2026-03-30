"use client";

import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Brain,
  Clock,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockDashboardStats } from "@/lib/mock-data";
import { useCountUp } from "@/hooks/useCountUp";

// ── Animaciones ───────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visible: { transition: { staggerChildren: 0.09 } } as any,
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ── Metric card ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  iconClass: string;
  iconBg: string;
  accentBorder?: boolean;
  extra?: React.ReactNode;
}

function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconClass,
  iconBg,
  accentBorder,
  extra,
}: MetricCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      className={cn(
        "relative overflow-hidden rounded-card border border-neutral-200 bg-white p-5 shadow-subtle",
        "transition-shadow duration-200 hover:shadow-card",
        accentBorder && "border-l-4 border-l-amber-400",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {label}
          </p>
          <p className="mt-2 font-heading text-3xl font-bold text-neutral-900">
            {value}
          </p>
          <p className="mt-1.5 text-xs text-neutral-500">{subtext}</p>
          {extra && <div className="mt-3">{extra}</div>}
        </div>

        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]",
            iconBg,
          )}
        >
          <Icon className={cn("h-5 w-5", iconClass)} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Mini progress bar ─────────────────────────────────────────────────────────

function AiProgressBar({ value }: { value: number }) {
  return (
    <div className="space-y-1">
      <div className="h-1.5 overflow-hidden rounded-full bg-ai-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
          className="h-full rounded-full bg-ai-500"
        />
      </div>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

export function MetricsRow() {
  const { totalProcessed, aiAccuracy, timeSaved, pendingReview } =
    mockDashboardStats;

  const animatedTotal = useCountUp({ target: totalProcessed, duration: 1000, delay: 100 });
  const animatedAccuracy = useCountUp({ target: aiAccuracy, duration: 900, delay: 200, decimals: 1 });
  const animatedTimeSaved = useCountUp({ target: timeSaved, duration: 800, delay: 300 });
  const animatedPending = useCountUp({ target: pendingReview, duration: 700, delay: 400 });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      {/* Transacciones procesadas */}
      <MetricCard
        label="Transacciones procesadas"
        value={animatedTotal.toString()}
        subtext="+47 este mes"
        icon={ArrowLeftRight}
        iconClass="text-primary-600"
        iconBg="bg-primary-50"
      />

      {/* Precisión IA */}
      <MetricCard
        label="Precisión de la IA"
        value={`${animatedAccuracy.toFixed(1)}%`}
        subtext="↑ 4% vs mes anterior"
        icon={Brain}
        iconClass="text-ai-600"
        iconBg="bg-ai-50"
        extra={<AiProgressBar value={aiAccuracy} />}
      />

      {/* Tiempo ahorrado */}
      <MetricCard
        label="Tiempo ahorrado"
        value={`${animatedTimeSaved} hs`}
        subtext="estimado este mes"
        icon={Clock}
        iconClass="text-success-600"
        iconBg="bg-success-50"
      />

      {/* Pendientes */}
      <MetricCard
        label="Pendientes de revisión"
        value={animatedPending.toString()}
        subtext="requieren tu atención"
        icon={AlertCircle}
        iconClass="text-amber-600"
        iconBg="bg-amber-50"
        accentBorder={pendingReview > 0}
        extra={
          pendingReview > 0 ? (
            <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
              <TrendingUp className="h-3 w-3" />
              Revisá los pendientes
            </div>
          ) : undefined
        }
      />
    </motion.div>
  );
}
