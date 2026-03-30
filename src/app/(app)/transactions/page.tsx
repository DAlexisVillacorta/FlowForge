import { ChevronRight, ArrowLeftRight } from "lucide-react";

export default function TransactionsPage() {
  return (
    <div className="animate-fade-in">
      <nav className="mb-6 flex items-center gap-1 text-sm text-neutral-400">
        <ArrowLeftRight className="h-4 w-4" />
        <span>FlowForge</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-neutral-700">Transacciones</span>
      </nav>
      <h1 className="font-heading text-3xl font-bold text-neutral-900">
        Transacciones
      </h1>
      <p className="mt-2 text-neutral-500">
        Todas las transacciones clasificadas por la IA
      </p>
    </div>
  );
}
