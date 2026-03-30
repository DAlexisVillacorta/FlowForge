"use client";

import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Upload } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
}

export function UploadZone({ onFileSelect }: UploadZoneProps) {
  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length > 0) {
        const code = rejected[0].errors[0]?.code;
        if (code === "file-too-large") {
          toast.error("El archivo supera el límite de 10 MB");
        } else {
          toast.error("Solo se aceptan archivos PDF o CSV");
        }
        return;
      }
      if (accepted[0]) onFileSelect(accepted[0]);
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
        "text/csv": [".csv"],
        "application/vnd.ms-excel": [".csv"],
        "text/plain": [".csv"],
      },
      maxSize: 10 * 1024 * 1024,
      multiple: false,
    });

  const isError = isDragReject;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <div
        {...getRootProps()}
        className={cn(
          "flex min-h-[300px] cursor-pointer flex-col items-center justify-center gap-0 rounded-xl border-2 border-dashed p-10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
          isDragActive && !isError &&
            "border-primary-400 bg-primary-50 shadow-[0_0_0_4px_rgba(13,148,136,0.08)]",
          isError && "border-danger-400 bg-danger-50",
          !isDragActive &&
            "border-neutral-300 bg-neutral-50 hover:border-primary-300 hover:bg-primary-50/40",
        )}
      >
        <input {...getInputProps()} />

        {/* Icono central */}
        <motion.div
          animate={isDragActive ? { scale: 1.18, y: -4 } : { scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className={cn(
            "mb-5 flex h-20 w-20 items-center justify-center rounded-2xl",
            isDragActive && !isError ? "bg-primary-100" : "bg-neutral-200",
            isError && "bg-danger-100",
          )}
        >
          <Upload
            className={cn(
              "h-9 w-9",
              isDragActive && !isError
                ? "text-primary-600"
                : "text-neutral-400",
              isError && "text-danger-500",
            )}
          />
        </motion.div>

        {/* Texto */}
        <p
          className={cn(
            "font-heading text-xl font-semibold",
            isDragActive && !isError ? "text-primary-700" : "text-neutral-700",
            isError && "text-danger-600",
          )}
        >
          {isError
            ? "Formato no soportado"
            : isDragActive
              ? "¡Soltá el archivo acá!"
              : "Arrastrá tu archivo acá"}
        </p>

        <p className="mt-2 text-center text-sm text-neutral-400">
          {isError
            ? "Solo se aceptan PDF o CSV de hasta 10 MB"
            : "o hacé click para seleccionar — PDF o CSV, máximo 10 MB"}
        </p>

        {/* Badges de tipo */}
        {!isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-7 flex items-center gap-2"
          >
            <span className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600">
              PDF
            </span>
            <span className="text-xs text-neutral-300">·</span>
            <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-600">
              CSV
            </span>
            <span className="text-xs text-neutral-300">·</span>
            <span className="text-xs text-neutral-400">máx. 10 MB</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
