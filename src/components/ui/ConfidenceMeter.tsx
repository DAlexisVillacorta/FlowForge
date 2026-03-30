"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, HelpCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
  confidence: number; // 0 a 1
  showLabel?: boolean;
  showIcon?: boolean;
  size?: "sm" | "md";
  className?: string;
}

function getLevel(confidence: number) {
  if (confidence < 0.5) return "low";
  if (confidence < 0.8) return "mid";
  return "high";
}

const levelConfig = {
  low: {
    bar: "bg-danger-500",
    text: "text-danger-600",
    bg: "bg-danger-100",
    icon: AlertCircle,
    label: "Baja confianza",
  },
  mid: {
    bar: "bg-amber-500",
    text: "text-amber-600",
    bg: "bg-amber-100",
    icon: HelpCircle,
    label: "Confianza media",
  },
  high: {
    bar: "bg-success-500",
    text: "text-success-600",
    bg: "bg-success-100",
    icon: CheckCircle2,
    label: "Alta confianza",
  },
};

export function ConfidenceMeter({
  confidence,
  showLabel = false,
  showIcon = true,
  size = "md",
  className,
}: ConfidenceMeterProps) {
  const [hovered, setHovered] = useState(false);
  const level = getLevel(confidence);
  const { bar, text, bg, icon: Icon, label } = levelConfig[level];
  const pct = Math.round(confidence * 100);

  return (
    <div
      className={cn("relative inline-flex items-center gap-2", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      {hovered && (
        <div className="absolute -top-8 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
          <div
            className={cn(
              "whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium",
              bg,
              text,
            )}
          >
            {label} · {pct}%
          </div>
        </div>
      )}

      {showIcon && (
        <Icon className={cn("shrink-0", text, size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      )}

      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-neutral-200",
          size === "sm" ? "h-1.5 w-16" : "h-2 w-24",
        )}
      >
        <motion.div
          className={cn("absolute inset-y-0 left-0 rounded-full", bar)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
        />
      </div>

      {showLabel && (
        <span className={cn("font-mono font-medium tabular-nums", text, size === "sm" ? "text-[11px]" : "text-xs")}>
          {pct}%
        </span>
      )}
    </div>
  );
}
