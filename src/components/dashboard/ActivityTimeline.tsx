"use client";

import { motion } from "framer-motion";
import {
  UploadCloud,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  FileBarChart2,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityConfig {
  icon: React.ElementType;
  iconClass: string;
  dotClass: string;
  bgClass: string;
}

const ACTIVITY_CONFIG: Record<string, ActivityConfig> = {
  upload: {
    icon: UploadCloud,
    iconClass: "text-blue-600",
    dotClass: "bg-blue-500",
    bgClass: "bg-blue-50",
  },
  classification: {
    icon: Sparkles,
    iconClass: "text-ai-600",
    dotClass: "bg-ai-500",
    bgClass: "bg-ai-50",
  },
  match_confirmed: {
    icon: CheckCircle2,
    iconClass: "text-success-600",
    dotClass: "bg-success-500",
    bgClass: "bg-success-50",
  },
  match_suggested: {
    icon: Lightbulb,
    iconClass: "text-ai-500",
    dotClass: "bg-ai-400",
    bgClass: "bg-ai-50",
  },
  report_generated: {
    icon: FileBarChart2,
    iconClass: "text-amber-600",
    dotClass: "bg-amber-400",
    bgClass: "bg-amber-50",
  },
  rule_created: {
    icon: BookOpen,
    iconClass: "text-primary-600",
    dotClass: "bg-primary-500",
    bgClass: "bg-primary-50",
  },
};

const NOW = new Date();

function getRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const diffMs = NOW.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 2) return "ahora mismo";
  if (diffMins < 60) return `hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours} hs`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "ayer";
  return `hace ${diffDays} días`;
}

interface ActivityTimelineProps {
  data?: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date | string;
    meta?: Record<string, unknown>;
  }>;
}

export function ActivityTimeline({ data = [] }: ActivityTimelineProps) {
  const recent = data.slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.34, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-card border border-neutral-200 bg-white shadow-subtle dark:border-white/[0.07] dark:bg-[#161B27] dark:shadow-[0_4px_28px_rgba(0,0,0,0.4)]"
    >
      <div className="border-b border-neutral-100 px-5 py-4 dark:border-white/[0.05]">
        <h2 className="font-heading text-base font-semibold text-neutral-900 dark:text-slate-100">
          Actividad reciente
        </h2>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-slate-400">
          Últimas acciones en tu cuenta
        </p>
      </div>

      <div className="px-5 py-4">
        <div className="relative space-y-0">
          {recent.length === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-400 dark:text-slate-500">Sin actividad reciente</p>
          ) : (
            recent.map((activity, index) => {
              const config = ACTIVITY_CONFIG[activity.type] ?? ACTIVITY_CONFIG.match_suggested;
              const Icon = config.icon;
              const isLast = index === recent.length - 1;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.32,
                    delay: 0.38 + index * 0.06,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="flex gap-3"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        config.bgClass,
                        "dark:bg-opacity-20",
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", config.iconClass)} />
                    </div>
                    {!isLast && (
                      <div className="mt-1 w-px flex-1 bg-neutral-100 dark:bg-white/[0.06]" style={{ minHeight: 16 }} />
                    )}
                  </div>

                  <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
                    <p className="text-sm leading-snug text-neutral-700 dark:text-slate-300">
                      {activity.description}
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-400 dark:text-slate-500">
                      {getRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
