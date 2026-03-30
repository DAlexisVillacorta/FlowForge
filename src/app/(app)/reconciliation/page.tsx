import { ChevronRight, GitCompareArrows } from "lucide-react";

export default function ReconciliationPage() {
  return (
    <div className="animate-fade-in">
      <nav className="mb-6 flex items-center gap-1 text-sm text-neutral-400">
        <GitCompareArrows className="h-4 w-4" />
        <span>FlowForge</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-neutral-700">Conciliación</span>
      </nav>
      <h1 className="font-heading text-3xl font-bold text-neutral-900">
        Conciliación
      </h1>
      <p className="mt-2 text-neutral-500">
        Conciliá transacciones bancarias con comprobantes
      </p>
    </div>
  );
}
