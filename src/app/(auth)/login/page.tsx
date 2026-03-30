import { ChevronRight } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md rounded-card bg-white p-8 shadow-card">
        <nav className="mb-6 flex items-center gap-1 text-sm text-neutral-400">
          <span>FlowForge</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-neutral-700">Iniciar sesión</span>
        </nav>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-neutral-500">
          Ingresá a tu cuenta de FlowForge
        </p>
      </div>
    </div>
  );
}
