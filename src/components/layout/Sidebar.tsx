"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  ArrowLeftRight,
  FileText,
  GitMerge,
  BarChart3,
  Settings,
  ChevronLeft,
  Zap,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockCurrentUser, mockOrganization } from "@/lib/mock-data";
import { useSidebar } from "./SidebarContext";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface NavBadge {
  text: string;
  variant: "ai" | "danger" | "warning";
  count?: number;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: NavBadge;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// ── Configuración de navegación ───────────────────────────────────────────────

const navSections: NavSection[] = [
  {
    title: "PRINCIPAL",
    items: [
      { label: "Panel principal", href: "/dashboard", icon: LayoutDashboard },
      {
        label: "Subir extracto",
        href: "/upload",
        icon: Upload,
        badge: { text: "Nuevo", variant: "ai" },
      },
      { label: "Transacciones", href: "/transactions", icon: ArrowLeftRight },
    ],
  },
  {
    title: "CONCILIACIÓN",
    items: [
      { label: "Facturas", href: "/invoices", icon: FileText },
      {
        label: "Conciliar",
        href: "/reconciliation",
        icon: GitMerge,
        badge: { text: "3", variant: "warning", count: 3 },
      },
    ],
  },
  {
    title: "REPORTES",
    items: [{ label: "Reportes", href: "/reports", icon: BarChart3 }],
  },
  {
    title: "CONFIGURACIÓN",
    items: [{ label: "Configuración", href: "/settings", icon: Settings }],
  },
];

// ── Badge para items de nav ───────────────────────────────────────────────────

const badgeVariantStyles = {
  ai: "bg-ai-500/20 text-ai-300 border border-ai-500/30",
  danger: "bg-danger-500/20 text-danger-300 border border-danger-500/30",
  warning: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
};

function NavBadge({ badge }: { badge: NavBadge }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium leading-none",
        badgeVariantStyles[badge.variant],
      )}
    >
      {badge.text}
    </span>
  );
}

// ── NavItem individual ────────────────────────────────────────────────────────

function NavItemComponent({
  item,
  collapsed,
  isActive,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150",
        isActive
          ? "bg-primary-500/20 text-primary-300"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
      )}
    >
      {/* Indicador activo */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary-400" />
      )}

      {/* Icono */}
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          isActive ? "text-primary-400" : "text-slate-500 group-hover:text-slate-300",
        )}
      />

      {/* Texto + badge */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-1 items-center justify-between overflow-hidden"
          >
            <span className="whitespace-nowrap text-sm font-medium">
              {item.label}
            </span>
            {item.badge && <NavBadge badge={item.badge} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge count encima del icono cuando está colapsado */}
      {collapsed && item.badge?.count !== undefined && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
          {item.badge.count}
        </span>
      )}
      {collapsed && item.badge && item.badge.count === undefined && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-ai-500" />
      )}

      {/* Tooltip cuando está colapsado */}
      {collapsed && (
        <div
          className={cn(
            "pointer-events-none absolute left-full z-50 ml-3",
            "opacity-0 transition-opacity duration-150 group-hover:opacity-100",
          )}
        >
          <div className="flex items-center gap-2 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-slate-100 shadow-elevated">
            {item.label}
            {item.badge && (
              <NavBadge badge={item.badge} />
            )}
          </div>
          {/* Arrow */}
          <div className="absolute left-0 top-1/2 h-0 w-0 -translate-x-1.5 -translate-y-1/2 border-y-4 border-r-4 border-y-transparent border-r-slate-800" />
        </div>
      )}
    </Link>
  );
}

// ── Iniciales de avatar ───────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ── Contenido compartido (desktop + mobile drawer) ───────────────────────────

function SidebarContent({
  collapsed,
  onClose,
}: {
  collapsed: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleCollapsed } = useSidebar();

  function handleLogout() {
    router.push("/login");
  }

  return (
    <div
      className="flex h-full flex-col"
      style={{
        background: "linear-gradient(180deg, #020617 0%, #0F1629 100%)",
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="flex h-16 shrink-0 items-center border-b border-white/8 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary-400 to-primary-600 shadow-md">
          <Zap className="h-[18px] w-[18px] text-white" />
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="ml-3 overflow-hidden"
            >
              <span className="whitespace-nowrap font-heading text-[17px] font-bold tracking-tight text-white">
                FlowForge
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón cerrar en mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-slate-500 hover:bg-white/10 hover:text-slate-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ── Navegación ───────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.title} className="mb-5">
            {/* Título de sección */}
            <AnimatePresence initial={false}>
              {!collapsed ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mb-1 overflow-hidden whitespace-nowrap px-5 text-[10px] font-semibold uppercase tracking-widest text-slate-600"
                >
                  {section.title}
                </motion.p>
              ) : (
                <div className="mx-4 mb-1 h-px bg-white/8" />
              )}
            </AnimatePresence>

            {/* Items */}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavItemComponent
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  isActive={pathname === item.href}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer: user info + collapse ─────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/8">
        {/* Org name */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden px-5 pt-3"
            >
              <p className="truncate text-[11px] font-medium text-slate-600">
                {mockOrganization.name}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-3">
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500/30 text-sm font-semibold text-primary-300 ring-1 ring-primary-500/40">
            {getInitials(mockCurrentUser.name)}
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="min-w-0 flex-1 overflow-hidden"
              >
                <p className="truncate text-sm font-medium text-slate-200">
                  {mockCurrentUser.name}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {mockCurrentUser.email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botón collapse + logout */}
        <div
          className={cn(
            "flex items-center border-t border-white/8 px-3 py-2",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {/* Logout */}
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-600 transition-colors hover:bg-white/5 hover:text-slate-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                Salir
              </motion.button>
            )}
          </AnimatePresence>

          {/* Toggle collapse */}
          <button
            onClick={toggleCollapsed}
            title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            className="group flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-white/8 hover:text-slate-300"
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar principal ─────────────────────────────────────────────────────────

const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 72;

export function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* ── Desktop sidebar (fixed) ──────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="fixed inset-y-0 left-0 z-20 hidden flex-col overflow-visible lg:flex"
      >
        <SidebarContent collapsed={collapsed} />
      </motion.aside>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              key="mobile-drawer"
              initial={{ x: -SIDEBAR_EXPANDED }}
              animate={{ x: 0 }}
              exit={{ x: -SIDEBAR_EXPANDED }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col overflow-hidden lg:hidden"
            >
              <SidebarContent
                collapsed={false}
                onClose={() => setMobileOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Exportar constantes para el AppShell ──────────────────────────────────────
export { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED };
