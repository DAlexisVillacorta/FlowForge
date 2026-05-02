"use client";

import { useState, useCallback, useEffect } from "react";
import { usePageLoader } from "@/hooks/usePageLoader";
import { PageLoader } from "@/components/ui/PageLoader";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ReportTypeCard } from "@/components/reports/ReportTypeCard";
import { ReportsTable } from "@/components/reports/ReportsTable";
import { ReportPreviewModal } from "@/components/reports/ReportPreviewModal";
import type { GeneratedReport, ReportType, ReportFormat } from "@/components/reports/types";

function ReportsPageContent() {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [statements, setStatements] = useState<Array<{ id: string; bankAccount?: { bankName: string }; periodStart: string }>>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/reports").then((r) => r.json()),
      fetch("/api/statements").then((r) => r.json()),
    ])
      .then(([reportsData, stmts]) => {
        const mapped = (reportsData || []).map((r: {
          id: string;
          reportType: string;
          statementId: string;
          generatedAt: string;
          filePath?: string;
          bankStatement?: {
            periodStart: Date;
            bankAccount?: { bankName: string };
          };
        }) => {
          const typeMap: Record<string, ReportType> = {
            conciliation: "conciliacion",
            monthly_summary: "resumen_mensual",
            tax_detail: "detalle_impositivo",
          };
          return {
            id: r.id,
            statementId: r.statementId,
            type: typeMap[r.reportType] || "conciliacion",
            period: r.bankStatement
              ? `${r.bankStatement.bankAccount?.bankName ?? ""} — ${new Date(r.bankStatement.periodStart).toLocaleString("es-AR", { month: "long", year: "numeric" })}`
              : "Sin período",
            format: r.filePath?.endsWith(".xlsx") ? "excel" as ReportFormat : "pdf" as ReportFormat,
            generatedAt: new Date(r.generatedAt),
          };
        });
        setReports(mapped);
        setStatements(stmts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const previewReport = reports.find((r) => r.id === previewId) ?? null;

  const [selectedStmtId, setSelectedStmtId] = useState("");

  const handleGenerate = useCallback(
    async (type: ReportType, period: string, format: ReportFormat, stmtId?: string) => {
      const typeMap: Record<ReportType, string> = {
        conciliacion: "conciliation",
        resumen_mensual: "monthly_summary",
        detalle_impositivo: "tax_detail",
      };

      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportType: typeMap[type],
            period,
            format,
            statementId: type === "conciliacion" ? stmtId : undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error al generar el reporte");
        }

        const newReport = await res.json();
        const reportTypeMap: Record<string, ReportType> = {
          conciliation: "conciliacion",
          monthly_summary: "resumen_mensual",
          tax_detail: "detalle_impositivo",
        };

        const stmt = statements.find(s => s.id === stmtId);
        const mappedReport: GeneratedReport = {
          id: newReport.id,
          statementId: newReport.statementId ?? stmtId,
          type: reportTypeMap[newReport.reportType] || "conciliacion",
          period: period || (stmt ? `${stmt.bankAccount?.bankName ?? ""} — ${new Date(stmt.periodStart).toLocaleString("es-AR", { month: "long", year: "numeric" })}` : "Generado"),
          format,
          generatedAt: new Date(newReport.generatedAt),
        };

        setReports((prev) => [mappedReport, ...prev]);
        toast.success("Reporte generado exitosamente", {
          icon: "📊",
          style: {
            background: "#f0fdf4",
            color: "#166534",
            border: "1px solid #86efac",
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        toast.error(message);
      }
    },
    [statements],
  );

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/reports/${id}`, { method: "DELETE" });
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast("Reporte eliminado", { icon: "🗑️" });
    } catch {
      toast.error("Error al eliminar el reporte");
    }
  }, []);

  if (loading) return <PageLoader variant="default" />;

  return (
    <div className="space-y-8">
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
            statements={statements}
          />
          <ReportTypeCard
            type="resumen_mensual"
            delay={0.14}
            onGenerate={handleGenerate}
            statements={statements}
          />
          <ReportTypeCard
            type="detalle_impositivo"
            delay={0.20}
            onGenerate={handleGenerate}
            statements={statements}
          />
        </div>
      </section>

      <section>
        <ReportsTable
          reports={reports}
          onPreview={setPreviewId}
          onDelete={handleDelete}
        />
      </section>

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
