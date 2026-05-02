export type ReportType =
  | "conciliacion"
  | "resumen_mensual"
  | "detalle_impositivo";

export type ReportFormat = "excel" | "pdf";

export interface GeneratedReport {
  id: string;
  statementId?: string;
  type: ReportType;
  period: string; // e.g. "Galicia — Marzo 2026"
  format: ReportFormat;
  generatedAt: Date;
}
