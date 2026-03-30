"use client";

import { motion } from "framer-motion";
import { Upload, Sparkles, CheckSquare, ShieldCheck, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// ── Bancos soportados ─────────────────────────────────────────────────────────

const SUPPORTED_BANKS = [
  { name: "Galicia", bg: "bg-orange-500", short: "GA" },
  { name: "BIND", bg: "bg-blue-600", short: "BI" },
  { name: "Santander", bg: "bg-red-600", short: "SA" },
  { name: "BBVA", bg: "bg-blue-500", short: "BB" },
  { name: "Macro", bg: "bg-yellow-500", short: "MA" },
  { name: "HSBC", bg: "bg-red-700", short: "HS" },
];

// ── Pasos de "Cómo funciona" ──────────────────────────────────────────────────

const HOW_STEPS = [
  {
    icon: Upload,
    label: "Subís el extracto PDF o CSV",
    color: "text-primary-600",
    bg: "bg-primary-50",
  },
  {
    icon: Sparkles,
    label: "La IA clasifica cada movimiento automáticamente",
    color: "text-ai-600",
    bg: "bg-ai-50",
  },
  {
    icon: CheckSquare,
    label: "Revisás, corregís y descargás el reporte",
    color: "text-success-600",
    bg: "bg-success-50",
  },
];

// ── FAQ item ──────────────────────────────────────────────────────────────────

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-neutral-100 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 py-3 text-left text-sm font-medium text-neutral-700 hover:text-neutral-900"
      >
        {question}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-neutral-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pb-3 text-xs leading-relaxed text-neutral-500"
        >
          {answer}
        </motion.p>
      )}
    </div>
  );
}

// ── Sidebar principal ─────────────────────────────────────────────────────────

export function InfoSidebar() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="space-y-4"
    >
      {/* Bancos soportados */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-subtle">
        <h3 className="mb-4 font-heading text-sm font-semibold text-neutral-900">
          Bancos soportados
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {SUPPORTED_BANKS.map((bank) => (
            <div
              key={bank.name}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-neutral-100 py-3 transition-colors hover:border-neutral-200 hover:bg-neutral-50"
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white",
                  bank.bg,
                )}
              >
                {bank.short}
              </div>
              <span className="text-[11px] text-neutral-500">{bank.name}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-neutral-400">
          + Otros bancos con formato estándar
        </p>
      </div>

      {/* Cómo funciona */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-subtle">
        <h3 className="mb-4 font-heading text-sm font-semibold text-neutral-900">
          ¿Cómo funciona?
        </h3>
        <div className="space-y-4">
          {HOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    step.bg,
                  )}
                >
                  <Icon className={cn("h-4 w-4", step.color)} />
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-600">
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-neutral-600">
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-subtle">
        <h3 className="mb-3 font-heading text-sm font-semibold text-neutral-900">
          Preguntas frecuentes
        </h3>
        <div>
          <FaqItem
            question="¿Es seguro subir mis archivos?"
            answer="Tus archivos se procesan de forma segura y no se comparten con terceros. Toda la información se encripta en tránsito y en reposo."
          />
          <FaqItem
            question="¿Qué formatos acepta?"
            answer="Aceptamos PDF y CSV de los principales bancos argentinos. El archivo debe ser el extracto original del banco, sin modificaciones."
          />
          <FaqItem
            question="¿Cuánto tarda el procesamiento?"
            answer="Generalmente menos de un minuto para extractos de hasta 500 transacciones. Extractos más grandes pueden tardar hasta 3 minutos."
          />
          <FaqItem
            question="¿Puedo corregir las clasificaciones?"
            answer="Sí. Después del procesamiento podés revisar cada transacción, cambiar la categoría y confirmar o rechazar los matches sugeridos por la IA."
          />
        </div>
      </div>

      {/* Badge de seguridad */}
      <div className="flex items-center gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-success-600" />
        <p className="text-xs text-success-700">
          <strong className="font-semibold">Procesamiento seguro.</strong>{" "}
          Tus datos nunca se comparten con terceros.
        </p>
      </div>
    </motion.div>
  );
}
