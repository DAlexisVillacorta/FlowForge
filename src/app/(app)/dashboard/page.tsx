import { ChevronRight, LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      <nav className="mb-6 flex items-center gap-1 text-sm text-neutral-400">
        <LayoutDashboard className="h-4 w-4" />
        <span>FlowForge</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-neutral-700">Panel principal</span>
      </nav>
      <h1 className="font-heading text-3xl font-bold text-neutral-900">
        Panel principal
      </h1>
      <p className="mt-2 text-neutral-500">
        Resumen general de tu contabilidad
      </p>
    </div>
  );
}
