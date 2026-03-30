"use client";

import { motion } from "framer-motion";
import { Tag, CheckCircle2, Download, X } from "lucide-react";

interface BulkActionsBarProps {
  count: number;
  hasMatchable: boolean;
  onChangeCategory: () => void;
  onConfirmMatches: () => void;
  onExport: () => void;
  onDeselectAll: () => void;
}

export function BulkActionsBar({
  count,
  hasMatchable,
  onChangeCategory,
  onConfirmMatches,
  onExport,
  onDeselectAll,
}: BulkActionsBarProps) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className="fixed bottom-14 left-0 right-0 z-30 flex justify-center px-4 pb-2 pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-neutral-300 bg-neutral-900 px-4 py-3 shadow-elevated">
        {/* Count */}
        <span className="mr-1 text-sm font-semibold text-white">
          {count} seleccionada{count !== 1 ? "s" : ""}
        </span>

        <div className="h-4 w-px bg-white/20" />

        {/* Cambiar categoría */}
        <button
          onClick={onChangeCategory}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
        >
          <Tag className="h-3.5 w-3.5" />
          Cambiar categoría
        </button>

        {/* Confirmar matches */}
        {hasMatchable && (
          <button
            onClick={onConfirmMatches}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-success-300 transition-colors hover:bg-white/10"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Confirmar matches
          </button>
        )}

        {/* Exportar selección */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar
        </button>

        <div className="h-4 w-px bg-white/20" />

        {/* Deseleccionar */}
        <button
          onClick={onDeselectAll}
          className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          title="Deseleccionar todo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
