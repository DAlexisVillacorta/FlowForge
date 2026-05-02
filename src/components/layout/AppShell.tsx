"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar, SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED } from "./Sidebar";
import { Header } from "./Header";
import { useSidebar } from "./SidebarContext";

// ── Page transition wrapper ───────────────────────────────────────────────────

function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ── AppShell ──────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-[#F8FAFC] transition-colors dark:bg-[#0D1117]">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* Contenido principal — se desplaza cuando el sidebar cambia */}
      <motion.div
        animate={{
          marginLeft: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="flex min-h-screen flex-col lg:ml-[260px]"
        style={{ marginLeft: undefined }}
      >
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </motion.div>
    </div>
  );
}
