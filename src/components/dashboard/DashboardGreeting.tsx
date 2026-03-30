"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import { motion } from "framer-motion";
import { mockCurrentUser } from "@/lib/mock-data";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buen día";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function DashboardGreeting() {
  const firstName = mockCurrentUser.name.split(" ")[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Acá tenés un resumen de tu contabilidad
        </p>
      </div>

      <Link
        href="/upload"
        className={[
          "inline-flex shrink-0 items-center gap-2 rounded-input bg-primary-600",
          "px-4 py-2.5 text-sm font-semibold text-white shadow-sm",
          "transition-all duration-150 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-md",
          "active:translate-y-0 active:shadow-sm focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        ].join(" ")}
      >
        <Upload className="h-4 w-4" />
        Subir extracto
      </Link>
    </motion.div>
  );
}
