"use client";

import { useState, useCallback } from "react";
import { usePageLoader } from "@/hooks/usePageLoader";
import { PageLoader } from "@/components/ui/PageLoader";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ReportTypeCard } from "@/components/reports/ReportTypeCard";
import { ReportsTable } from "@/components/reports/ReportsTable";
import { ReportPreviewModal } from "@/components/reports/ReportPreviewModal";
import type { GeneratedReport, ReportType, ReportFormat } from "@/components/reports/types";

// ── Initial mock reports ──────────────────────────────────────────────────────

let nextId = 4;

const INITIAL_REPORTS: GeneratedReport[] = [
  {
    id: "rep-1",
    type: "conciliacion",
    period: "Galicia — Marzo 2026",
    format: "excel",
    generatedAt: new Date("2026-03-30T10:00:00"),
  },
  {
    id: "rep-2",
    type: "resumen_mensual",
    period: "Febrero 2026",
    format: "pdf",
    generatedAt: new Date("2026-03-01T09:00:00"),
  },
  {
    id: "rep-3",
    type: "detalle_impositivo",
    period: "Febrero 2026",
    format: "excel",
    generatedAt: new Date("2026-03-01T09:30:00"),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

function ReportsPageContent() {
  const [reports, setReports] = useState<GeneratedReport[]>(INITIAL_REPORTS);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const previewReport = reports.find((r) => r.id === previewId) ?? null;

  const handleGenerate = useCallback(
    (type: ReportType, period: string, format: ReportFormat) => {
      const newReport: GeneratedReport = {
        id: `rep-${nextId++}`,
        type,
        period,
        format,
        generatedAt: new Date("2026-03-30T12:00:00"),
      };
      setReports((prev) => [newReport, ...prev]);
      toast.success("Reporte generado exitosamente", {
        icon: "📊",
        style: {
          background: "#f0fdf4",
          color: "#166534",
          border: "1px solid #86efac",
        },
      });
    },
    [],
  );

  const handleDelete = useCallback((id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast("Reporte eliminado", { icon: "🗑️" });
  }, []);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Reportes
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Generá y descargá reportes de tu contabilidad
        </p>
      </motion.div>

      {/* Generator cards */}
      <section>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="mb-4"
        >
          <h2 className="font-heading text-base font-bold text-neutral-800">
            Generador de reportes
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Seleccioná el tipo de reporte, el período y el formato deseado
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReportTypeCard
            type="conciliacion"
            delay={0.08}
            onGenerate={handleGenerate}
          />
          <ReportTypeCard
            type="resumen_mensual"
            delay={0.14}
            onGenerate={handleGenerate}
          />
          <ReportTypeCard
            type="detalle_impositivo"
            delay={0.20}
            onGenerate={handleGenerate}
          />
        </div>
      </section>

      {/* Generated reports table */}
      <section>
        <ReportsTable
          reports={reports}
          onPreview={setPreviewId}
          onDelete={handleDelete}
        />
      </section>

      {/* Preview modal */}
      <ReportPreviewModal
        report={previewReport}
        isOpen={previewId !== null}
        onClose={() => setPreviewId(null)}
      />
    </div>
  );
}

export default function ReportsPage() {
  const loading = usePageLoader();
  if (loading) return <PageLoader variant="default" />;
  return <ReportsPageContent />;
}
