"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadZone } from "@/components/upload/UploadZone";
import { FilePreview } from "@/components/upload/FilePreview";
import { BankAccountSelector } from "@/components/upload/BankAccountSelector";
import { ProcessingView } from "@/components/upload/ProcessingView";
import { SuccessView } from "@/components/upload/SuccessView";
import { InfoSidebar } from "@/components/upload/InfoSidebar";

// ── Step indicator ────────────────────────────────────────────────────────────

const STEP_LABELS = ["Seleccioná el archivo", "Configurá el extracto", "Procesando", "¡Listo!"];

function StepIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center gap-0">
      {STEP_LABELS.map((label, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3 | 4;
        const isDone = current > stepNum;
        const isActive = current === stepNum;
        return (
          <div key={i} className="flex items-center">
            {/* Dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300",
                  isDone &&
                    "border-primary-500 bg-primary-500 text-white",
                  isActive &&
                    "border-primary-500 bg-white text-primary-600",
                  !isDone && !isActive &&
                    "border-neutral-200 bg-white text-neutral-400",
                )}
              >
                {isDone ? "✓" : stepNum}
              </div>
              <span
                className={cn(
                  "mt-1 hidden whitespace-nowrap text-[11px] sm:block",
                  isActive ? "font-semibold text-primary-600" : "text-neutral-400",
                )}
              >
                {label}
              </span>
            </div>

            {/* Línea conectora */}
            {i < STEP_LABELS.length - 1 && (
              <div className="mx-1 mt-[-14px] h-0.5 w-8 sm:w-14 transition-colors duration-300 md:w-20">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    current > stepNum ? "bg-primary-400" : "bg-neutral-200",
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Botón procesar ────────────────────────────────────────────────────────────

function ProcessButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={cn(
        "mt-5 flex w-full items-center justify-center gap-2 rounded-input py-3 text-sm font-semibold transition-all duration-200",
        disabled
          ? "cursor-not-allowed bg-neutral-100 text-neutral-400"
          : "bg-primary-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-md",
      )}
    >
      <ArrowRight className="h-4 w-4" />
      Procesar extracto
    </motion.button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [selectedBank, setSelectedBank] = useState("");
  const [accountId, setAccountId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    setStep(2);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setSelectedBank("");
    setAccountId("");
    setDateFrom("");
    setDateTo("");
    setStep(1);
  }, []);

  const handleProcess = useCallback(() => {
    setStep(3);
  }, []);

  const handleProcessingComplete = useCallback(() => {
    setStep(4);
  }, []);

  const canProcess = selectedBank !== "" && dateFrom !== "" && dateTo !== "";
  const isFullWidth = step === 3 || step === 4;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
          Subí tu extracto bancario
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Aceptamos PDF y CSV de los principales bancos argentinos
        </p>
      </motion.div>

      {/* Step indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center sm:justify-start"
      >
        <StepIndicator current={step} />
      </motion.div>

      {/* Layout principal */}
      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          !isFullWidth && "lg:grid-cols-3",
        )}
      >
        {/* Columna principal */}
        <div className={cn(!isFullWidth && "lg:col-span-2")}>
          <AnimatePresence mode="wait">
            {/* STEP 1: Upload zone */}
            {step === 1 && (
              <motion.div key="step-1">
                <UploadZone onFileSelect={handleFileSelect} />
              </motion.div>
            )}

            {/* STEP 2: File + form */}
            {step === 2 && file && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28 }}
                className="space-y-4"
              >
                <FilePreview file={file} onRemove={handleRemoveFile} />

                <BankAccountSelector
                  selectedBank={selectedBank}
                  onBankChange={setSelectedBank}
                  accountId={accountId}
                  onAccountChange={setAccountId}
                  dateFrom={dateFrom}
                  onDateFromChange={setDateFrom}
                  dateTo={dateTo}
                  onDateToChange={setDateTo}
                />

                <ProcessButton
                  disabled={!canProcess}
                  onClick={handleProcess}
                />

                {!canProcess && (
                  <p className="text-center text-xs text-neutral-400">
                    Completá el banco y el período para continuar
                  </p>
                )}
              </motion.div>
            )}

            {/* STEP 3: Processing */}
            {step === 3 && (
              <motion.div key="step-3">
                <ProcessingView onComplete={handleProcessingComplete} />
              </motion.div>
            )}

            {/* STEP 4: Success */}
            {step === 4 && (
              <motion.div key="step-4">
                <SuccessView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar informativa — visible en steps 1 y 2 */}
        <AnimatePresence>
          {!isFullWidth && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
              className="lg:col-span-1"
            >
              <InfoSidebar />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
