"use client";

import { motion } from "framer-motion";
import { FileText, FileSpreadsheet, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

function formatFileSize(bytes: number): string {
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const isPdf = file.name.toLowerCase().endsWith(".pdf");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-subtle"
    >
      {/* Icono tipo archivo */}
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          isPdf ? "bg-red-50" : "bg-emerald-50",
        )}
      >
        {isPdf ? (
          <FileText className="h-6 w-6 text-red-500" />
        ) : (
          <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-900">
          {file.name}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[11px] font-semibold",
              isPdf
                ? "bg-red-100 text-red-600"
                : "bg-emerald-100 text-emerald-700",
            )}
          >
            {isPdf ? "PDF" : "CSV"}
          </span>
          <span className="font-mono text-xs text-neutral-400">
            {formatFileSize(file.size)}
          </span>
        </div>
      </div>

      {/* Cambiar archivo */}
      <button
        onClick={onRemove}
        className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Cambiar
      </button>
    </motion.div>
  );
}
