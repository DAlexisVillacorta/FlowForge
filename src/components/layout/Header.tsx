"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Search,
  Menu,
  ChevronRight,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockCurrentUser } from "@/lib/mock-data";
import { useSidebar } from "./SidebarContext";

// ── Mapa de rutas a breadcrumb ────────────────────────────────────────────────

interface BreadcrumbSegment {
  label: string;
  href: string;
}

const routeMap: Record<string, string> = {
  dashboard: "Panel principal",
  upload: "Subir extracto",
  transactions: "Transacciones",
  invoices: "Facturas",
  reconciliation: "Conciliación",
  reports: "Reportes",
  settings: "Configuración",
};

function useBreadcrumb(): BreadcrumbSegment[] {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs: BreadcrumbSegment[] = [];
  let accumulated = "";

  for (const segment of segments) {
    accumulated += `/${segment}`;
    const label = routeMap[segment];
    if (label) {
      crumbs.push({ label, href: accumulated });
    } else {
      // Segmento sin mapeo → capitalizar el texto tal cual
      crumbs.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: accumulated,
      });
    }
  }

  return crumbs;
}

// ── Scroll shadow ─────────────────────────────────────────────────────────────

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = document.querySelector("main");
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > threshold);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
    // threshold is a stable primitive, intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return scrolled;
}

// ── Iniciales ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ── User dropdown ─────────────────────────────────────────────────────────────

function UserDropdown() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" data-user-menu>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
          "bg-primary-100 text-primary-700 ring-2 ring-transparent",
          "hover:ring-primary-200 focus-visible:outline-none focus-visible:ring-primary-400",
          open && "ring-primary-300",
        )}
        aria-label="Menú de usuario"
        aria-expanded={open}
      >
        {getInitials(mockCurrentUser.name)}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-card border border-neutral-200 bg-white shadow-elevated">
          {/* User info header */}
          <div className="border-b border-neutral-100 px-4 py-3">
            <p className="text-sm font-semibold text-neutral-900">
              {mockCurrentUser.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-neutral-500">
              {mockCurrentUser.email}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <DropdownItem icon={User} label="Mi cuenta" href="/settings" />
            <DropdownItem icon={Settings} label="Configuración" href="/settings" />
            <div className="my-1 mx-2 h-px bg-neutral-100" />
            <button className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-danger-600 transition-colors hover:bg-danger-50">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
    >
      <Icon className="h-4 w-4 text-neutral-400" />
      {label}
    </Link>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

export function Header() {
  const { setMobileOpen } = useSidebar();
  const scrolled = useScrolled();
  const crumbs = useBreadcrumb();
  const hasNotifications = true; // mock: siempre hay pendientes

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-14 items-center gap-4 border-b px-4 transition-all duration-200 lg:px-6",
        scrolled
          ? "border-neutral-200 bg-white/90 shadow-subtle backdrop-blur-md"
          : "border-neutral-100 bg-white/80 backdrop-blur-sm",
      )}
    >
      {/* Hamburger — solo mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb */}
      <nav
        aria-label="Ubicación"
        className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden"
      >
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" />
            )}
            {i < crumbs.length - 1 ? (
              <Link
                href={crumb.href}
                className="truncate text-sm text-neutral-400 transition-colors hover:text-neutral-600"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="truncate text-sm font-semibold text-neutral-800">
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Acciones derecha */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Buscador global */}
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="Buscar transacciones, facturas…"
            className={cn(
              "h-8 w-52 rounded-input border border-neutral-200 bg-neutral-50 pl-8 pr-3 text-xs text-neutral-900",
              "placeholder:text-neutral-400 outline-none transition-all",
              "focus:w-64 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-500/15",
              "lg:w-60",
            )}
          />
        </div>

        {/* Notificaciones */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Notificaciones"
        >
          <Bell className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          {hasNotifications && (
            <span
              aria-label="Tenés notificaciones pendientes"
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white"
            />
          )}
        </button>

        {/* Avatar + dropdown */}
        <UserDropdown />
      </div>
    </header>
  );
}
