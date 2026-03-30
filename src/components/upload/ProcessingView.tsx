"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Steps de procesamiento ────────────────────────────────────────────────────

interface ProcessStep {
  label: string;
  completesAt: number; // ms desde inicio
  isAi?: boolean;
}

const PROCESS_STEPS: ProcessStep[] = [
  { label: "Leyendo archivo...", completesAt: 1500 },
  { label: "Extrayendo transacciones...", completesAt: 3000 },
  { label: "Clasificando con IA...", completesAt: 4500, isAi: true },
  { label: "Buscando coincidencias...", completesAt: 5500 },
  { label: "Generando reporte preliminar...", completesAt: 6300 },
];

// ── Dots pulsantes (loader decorativo) ───────────────────────────────────────

function PulsingDots() {
  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.22,
            ease: "easeInOut",
          }}
          className="h-3 w-3 rounded-full bg-ai-500"
        />
      ))}
    </div>
  );
}

// ── Barra de progreso con gradiente animado ───────────────────────────────────

function GradientProgressBar({ pct }: { pct: number }) {
  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-neutral-100">
      {/* Barra de progreso real */}
      <motion.div
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-ai-500 to-primary-500"
      />
      {/* Shimmer sobre la barra */}
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
      />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

interface ProcessingViewProps {
  onComplete: () => void;
}

export function ProcessingView({ onComplete }: ProcessingViewProps) {
  const [completedIndexes, setCompletedIndexes] = useState<number[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleComplete = useCallback(onComplete, [onComplete]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    PROCESS_STEPS.forEach((step, i) => {
      timers.push(
        setTimeout(() => {
          setCompletedIndexes((prev) => [...prev, i]);
          setActiveIndex(i + 1);
        }, step.completesAt),
      );
    });

    // Navegar al siguiente step un poco después del último
    timers.push(setTimeout(handleComplete, 7000));

    return () => timers.forEach(clearTimeout);
  }, [handleComplete]);

  const pct = Math.round(
    (completedIndexes.length / PROCESS_STEPS.length) * 100,
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center rounded-xl border border-ai-200 bg-white px-6 py-10 shadow-subtle"
    >
      {/* Loader decorativo */}
      <div className="mb-6 flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ai-50">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-ai-500" />
          </motion.div>
        </div>

        <PulsingDots />
      </div>

      {/* Título */}
      <h3 className="mb-1 font-heading text-xl font-bold text-neutral-900">
        Procesando tu extracto
      </h3>
      <p className="mb-6 text-sm text-neutral-500">
        Este proceso toma unos segundos…
      </p>

      {/* Barra de progreso */}
      <div className="mb-8 w-full max-w-xs">
        <div className="mb-1.5 flex justify-between text-xs text-neutral-400">
          <span>Progreso</span>
          <span className="font-mono font-medium text-ai-600">{pct}%</span>
        </div>
        <GradientProgressBar pct={pct} />
      </div>

      {/* Steps */}
      <div className="w-full max-w-xs space-y-3">
        {PROCESS_STEPS.map((step, i) => {
          const isCompleted = completedIndexes.includes(i);
          const isActive = activeIndex === i && !isCompleted;
          const isPending = !isCompleted && !isActive;

          return (
            <div key={i} className="flex items-center gap-3">
              {/* Icono de estado */}
              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 18,
                      }}
                    >
                      <CheckCircle2 className="h-5 w-5 text-success-500" />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div
                      key="spin"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, rotate: 360 }}
                      transition={{
                        opacity: { duration: 0.2 },
                        rotate: {
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        },
                      }}
                    >
                      <Loader2 className="h-5 w-5 text-ai-500" />
                    </motion.div>
                  ) : (
                    <motion.div key="circle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Circle className="h-5 w-5 text-neutral-300" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Label */}
              {isActive && step.isAi ? (
                <>
                  <style>{`
                    @keyframes aiShimmer {
                      0% { background-position: 0% center; }
                      100% { background-position: 200% center; }
                    }
                    .ai-shimmer {
                      background: linear-gradient(90deg, #7C3AED, #C4B5FD, #8B5CF6, #C4B5FD, #7C3AED);
                      background-size: 200% auto;
                      -webkit-background-clip: text;
                      -webkit-text-fill-color: transparent;
                      background-clip: text;
                      animation: aiShimmer 1.8s linear infinite;
                    }
                  `}</style>
                  <span className={cn("text-sm font-semibold ai-shimmer")}>
                    {step.label}
                  </span>
                </>
              ) : (
                <span
                  className={cn(
                    "text-sm",
                    isCompleted && "font-medium text-success-600",
                    isActive && "font-semibold text-ai-700",
                    isPending && "text-neutral-400",
                  )}
                >
                  {step.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
