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
import { useCountUp } from "@/hooks/useCountUp";

const containerVariants = {
  hidden: {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visible: { transition: { staggerChildren: 0.09 } } as any,
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

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
        "transition-all duration-200 hover:shadow-card",
        "dark:border-white/[0.07] dark:bg-[#161B27] dark:shadow-[0_4px_28px_rgba(0,0,0,0.4)] dark:hover:border-white/[0.12]",
        accentBorder && "border-l-4 border-l-amber-400 dark:border-l-amber-400",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 font-heading text-3xl font-bold text-neutral-900 dark:text-slate-100">
            {value}
          </p>
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-slate-400">{subtext}</p>
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

interface MetricsRowProps {
  data?: {
    stats: {
      totalProcessed: number;
      aiAccuracy: number;
      timeSaved: number;
      pendingReview: number;
    };
  };
}

export function MetricsRow({ data }: MetricsRowProps) {
  const totalProcessed = data?.stats.totalProcessed ?? 0;
  const aiAccuracy = data?.stats.aiAccuracy ?? 0;
  const timeSaved = data?.stats.timeSaved ?? 0;
  const pendingReview = data?.stats.pendingReview ?? 0;

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
      <MetricCard
        label="Transacciones procesadas"
        value={animatedTotal.toString()}
        subtext={`${totalProcessed} en total`}
        icon={ArrowLeftRight}
        iconClass="text-primary-600 dark:text-primary-400"
        iconBg="bg-primary-50 dark:bg-primary-500/15"
      />

      <MetricCard
        label="Precisión de la IA"
        value={`${animatedAccuracy.toFixed(1)}%`}
        subtext={aiAccuracy > 0 ? "Basado en matches confirmados" : "Sin datos aún"}
        icon={Brain}
        iconClass="text-ai-600 dark:text-ai-400"
        iconBg="bg-ai-50 dark:bg-ai-500/15"
        extra={aiAccuracy > 0 ? <AiProgressBar value={aiAccuracy} /> : undefined}
      />

      <MetricCard
        label="Tiempo ahorrado"
        value={`${animatedTimeSaved} hs`}
        subtext="estimado este mes"
        icon={Clock}
        iconClass="text-success-600 dark:text-success-400"
        iconBg="bg-success-50 dark:bg-success-500/15"
      />

      <MetricCard
        label="Pendientes de revisión"
        value={animatedPending.toString()}
        subtext="requieren tu atención"
        icon={AlertCircle}
        iconClass="text-amber-600 dark:text-amber-400"
        iconBg="bg-amber-50 dark:bg-amber-500/15"
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
