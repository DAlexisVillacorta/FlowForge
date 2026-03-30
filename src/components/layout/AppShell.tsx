"use client";

import { motion } from "framer-motion";
import { Sidebar, SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED } from "./Sidebar";
import { Header } from "./Header";
import { useSidebar } from "./SidebarContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* Contenido principal — se desplaza cuando el sidebar cambia */}
      <motion.div
        animate={{
          marginLeft: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="flex min-h-screen flex-col lg:ml-[260px]" // fallback SSR
        style={{ marginLeft: undefined }} // framer-motion sobreescribe
      >
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </motion.div>
    </div>
  );
}
