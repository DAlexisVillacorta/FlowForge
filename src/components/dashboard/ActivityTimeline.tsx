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
import { mockRecentActivity } from "@/lib/mock-data";
import type { RecentActivityType } from "@/lib/types";

// ── Configuración por tipo de actividad ───────────────────────────────────────

interface ActivityConfig {
  icon: React.ElementType;
  iconClass: string;
  dotClass: string;
  bgClass: string;
}

const ACTIVITY_CONFIG: Record<RecentActivityType, ActivityConfig> = {
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

// ── Timestamp relativo ────────────────────────────────────────────────────────

// Fecha de referencia fija para el mock (30/03/2026 12:00)
const NOW = new Date("2026-03-30T12:00:00");

function getRelativeTime(date: Date): string {
  const diffMs = NOW.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 2) return "ahora mismo";
  if (diffMins < 60) return `hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours} hs`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "ayer";
  return `hace ${diffDays} días`;
}

// ── Componente principal ──────────────────────────────────────────────────────

// Mostrar las 8 más recientes
const RECENT = mockRecentActivity.slice(0, 8);

export function ActivityTimeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.34, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-card border border-neutral-200 bg-white shadow-subtle"
    >
      {/* Header */}
      <div className="border-b border-neutral-100 px-5 py-4">
        <h2 className="font-heading text-base font-semibold text-neutral-900">
          Actividad reciente
        </h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          Últimas acciones en tu cuenta
        </p>
      </div>

      {/* Timeline */}
      <div className="px-5 py-4">
        <div className="relative space-y-0">
          {RECENT.map((activity, index) => {
            const config = ACTIVITY_CONFIG[activity.type];
            const Icon = config.icon;
            const isLast = index === RECENT.length - 1;

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
                {/* Dot + línea vertical */}
                <div className="flex flex-col items-center">
                  {/* Icono */}
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      config.bgClass,
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", config.iconClass)} />
                  </div>
                  {/* Línea conectora */}
                  {!isLast && (
                    <div className="mt-1 w-px flex-1 bg-neutral-100" style={{ minHeight: 16 }} />
                  )}
                </div>

                {/* Contenido */}
                <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
                  <p className="text-sm leading-snug text-neutral-700">
                    {activity.description}
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    {getRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
