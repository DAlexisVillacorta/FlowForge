"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";

// ── Confetti ──────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  "#0D9488",
  "#F59E0B",
  "#8B5CF6",
  "#F97316",
  "#3B82F6",
  "#EC4899",
  "#10B981",
];

interface Particle {
  id: number;
  color: string;
  x: number;
  size: number;
  delay: number;
  duration: number;
  rotate: number;
  isRect: boolean;
}

function Confetti() {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        x: 5 + Math.random() * 90,
        size: 5 + Math.random() * 7,
        delay: Math.random() * 0.7,
        duration: 1.4 + Math.random() * 0.9,
        rotate: Math.random() * 540 - 270,
        isRect: i % 3 !== 0,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden rounded-xl">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -16, opacity: 1, rotate: 0 }}
          animate={{ y: 320, opacity: 0, rotate: p.rotate }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.2, 0, 0.8, 1],
          }}
          className="absolute top-0"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.isRect ? p.size * 1.8 : p.size,
            backgroundColor: p.color,
            borderRadius: p.isRect ? 2 : "50%",
          }}
        />
      ))}
    </div>
  );
}

// ── Mini stat ─────────────────────────────────────────────────────────────────

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
      <p className="font-heading text-xl font-bold text-neutral-900">{value}</p>
      <p className="mt-0.5 text-xs leading-tight text-neutral-500">{label}</p>
    </div>
  );
}

// ── SuccessView ───────────────────────────────────────────────────────────────

export function SuccessView({ onNewUpload: _onNewUpload }: { onNewUpload?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, type: "spring", stiffness: 300, damping: 28 }}
      className="relative overflow-hidden rounded-xl border-2 border-success-300 bg-white px-6 py-10 shadow-subtle"
    >
      {/* Confetti */}
      <Confetti />

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Check animado */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-success-50"
        >
          <CheckCircle2 className="h-9 w-9 text-success-600" />
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.3 }}
          className="font-heading text-2xl font-bold text-neutral-900"
        >
          ¡Listo! Procesamos tu extracto
        </motion.h3>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-sm text-neutral-500"
        >
          La IA analizó y clasificó tus transacciones automáticamente
        </motion.p>

        {/* Mini stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.3 }}
          className="mt-7 grid w-full grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <MiniStat value="47" label="Transacciones encontradas" />
          <MiniStat value="41 (87%)" label="Clasificadas automáticamente" />
          <MiniStat value="12" label="Coincidencias con facturas" />
          <MiniStat value="6" label="Requieren tu revisión" />
        </motion.div>

        {/* Acciones */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.3 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <Link
            href="/transactions"
            className="inline-flex items-center justify-center gap-2 rounded-input bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-md"
          >
            Revisar transacciones
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-input border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <LayoutDashboard className="h-4 w-4 text-neutral-400" />
            Ir al dashboard
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
