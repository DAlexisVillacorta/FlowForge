import { ChevronRight, FileText } from "lucide-react";

export default function InvoicesPage() {
  return (
    <div className="animate-fade-in">
      <nav className="mb-6 flex items-center gap-1 text-sm text-neutral-400">
        <FileText className="h-4 w-4" />
        <span>FlowForge</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-neutral-700">Comprobantes</span>
      </nav>
      <h1 className="font-heading text-3xl font-bold text-neutral-900">
        Comprobantes
      </h1>
      <p className="mt-2 text-neutral-500">
        Facturas, notas de crédito y recibos
      </p>
    </div>
  );
}
