"use client";

import { useState } from "react";
import { usePageLoader } from "@/hooks/usePageLoader";
import { PageLoader } from "@/components/ui/PageLoader";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Landmark,
  Zap,
  User,
  SlidersHorizontal,
  ChevronRight,
  Settings,
} from "lucide-react";
import { EmpresaTab } from "@/components/settings/EmpresaTab";
import { CuentasBancariasTab } from "@/components/settings/CuentasBancariasTab";
import { ReglasTab } from "@/components/settings/ReglasTab";
import { PerfilTab } from "@/components/settings/PerfilTab";
import { PreferenciasTab } from "@/components/settings/PreferenciasTab";

// ── Tab config ────────────────────────────────────────────────────────────────

type TabId = "empresa" | "cuentas" | "reglas" | "perfil" | "preferencias";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: "empresa",
    label: "Mi empresa",
    icon: Building2,
    description: "Datos fiscales y de contacto",
  },
  {
    id: "cuentas",
    label: "Cuentas bancarias",
    icon: Landmark,
    description: "Cuentas vinculadas a tu org.",
  },
  {
    id: "reglas",
    label: "Reglas de clasificación",
    icon: Zap,
    description: "Patrones para clasificar txs",
  },
  {
    id: "perfil",
    label: "Mi perfil",
    icon: User,
    description: "Tu información de usuario",
  },
  {
    id: "preferencias",
    label: "Preferencias",
    icon: SlidersHorizontal,
    description: "Formato, notificaciones y más",
  },
];

// ── Tab content ───────────────────────────────────────────────────────────────

function TabContent({ tab }: { tab: TabId }) {
  switch (tab) {
    case "empresa":
      return <EmpresaTab />;
    case "cuentas":
      return <CuentasBancariasTab />;
    case "reglas":
      return <ReglasTab />;
    case "perfil":
      return <PerfilTab />;
    case "preferencias":
      return <PreferenciasTab />;
  }
}

// ── SettingsPage ──────────────────────────────────────────────────────────────

function SettingsPageContent() {
  const [activeTab, setActiveTab] = useState<TabId>("empresa");

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-neutral-400">
        <Settings className="h-4 w-4" />
        <span>FlowForge</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-neutral-700">Configuración</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          Configuración
        </h1>
        <p className="mt-1.5 text-neutral-500">
          Configurá tu organización, cuentas bancarias y preferencias
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Sidebar — desktop */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-subtle">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-neutral-50 ${
                    isActive ? "bg-primary-50 hover:bg-primary-50" : ""
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="settings-sidebar-indicator"
                      className="absolute inset-y-0 left-0 w-0.5 rounded-r-full bg-primary-600"
                    />
                  )}
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary-100 text-primary-600"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium leading-tight ${
                        isActive ? "text-primary-700" : "text-neutral-700"
                      }`}
                    >
                      {tab.label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-tight text-neutral-400">
                      {tab.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile tabs — horizontal scroll */}
        <div className="lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-600 text-white"
                      : "border border-neutral-200 bg-white text-neutral-600"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <TabContent tab={activeTab} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const loading = usePageLoader();
  if (loading) return <PageLoader variant="settings" />;
  return <SettingsPageContent />;
}
