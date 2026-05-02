"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  Bell,
  Search,
  Menu,
  ChevronRight,
  User,
  LogOut,
  Settings,
  Moon,
  Sun,
  ArrowLeftRight,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockTransactions, mockInvoices } from "@/lib/mock-data";
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
  const { data: session } = useSession();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleLogout() {
    setOpen(false);
    signOut({ callbackUrl: "/login" });
  }

  const userName = session?.user?.name ?? "Usuario";
  const userEmail = session?.user?.email ?? "";

  return (
    <div className="relative" data-user-menu>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
          "bg-primary-100 text-primary-700 ring-2 ring-transparent",
          "hover:ring-primary-200 focus-visible:outline-none focus-visible:ring-primary-400",
          "dark:bg-primary-500/20 dark:text-primary-300 dark:hover:ring-primary-500/40",
          open && "ring-primary-300 dark:ring-primary-500/40",
        )}
        aria-label="Menú de usuario"
        aria-expanded={open}
      >
        {getInitials(userName)}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-card border border-neutral-200 bg-white shadow-elevated dark:border-white/[0.1] dark:bg-[#1C2336] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* User info header */}
          <div className="border-b border-neutral-100 px-4 py-3 dark:border-white/[0.06]">
            <p className="text-sm font-semibold text-neutral-900 dark:text-slate-100">
              {userName}
            </p>
            <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-slate-400">
              {userEmail}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <DropdownItem icon={User} label="Mi cuenta" href="/settings" />
            <DropdownItem
              icon={Settings}
              label="Configuración"
              href="/settings"
            />
            <div className="mx-2 my-1 h-px bg-neutral-100 dark:bg-white/[0.06]" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-danger-600 transition-colors hover:bg-danger-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
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
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-slate-300 dark:hover:bg-white/[0.05]"
    >
      <Icon className="h-4 w-4 text-neutral-400 dark:text-slate-500" />
      {label}
    </Link>
  );
}

// ── Global search ─────────────────────────────────────────────────────────────

type SearchResult =
  | { kind: "transaction"; id: string; label: string; sub: string }
  | { kind: "invoice"; id: string; label: string; sub: string };

const MAX_RESULTS = 4;

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: SearchResult[] = [];

    for (const tx of mockTransactions) {
      if (out.filter((r) => r.kind === "transaction").length >= MAX_RESULTS) break;
      if (
        tx.description.toLowerCase().includes(q) ||
        tx.aiCategory.toLowerCase().includes(q)
      ) {
        const amt = new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
          maximumFractionDigits: 0,
        }).format(Math.abs(tx.amount));
        out.push({
          kind: "transaction",
          id: tx.id,
          label: tx.description,
          sub: `${tx.amount < 0 ? "−" : "+"}${amt} · ${tx.aiCategory}`,
        });
      }
    }

    for (const inv of mockInvoices) {
      if (out.filter((r) => r.kind === "invoice").length >= MAX_RESULTS) break;
      if (
        inv.counterpartyName.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.counterpartyCuit.includes(q)
      ) {
        const amt = new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
          maximumFractionDigits: 0,
        }).format(inv.totalAmount);
        out.push({
          kind: "invoice",
          id: inv.id,
          label: inv.counterpartyName,
          sub: `${inv.invoiceNumber} · ${amt}`,
        });
      }
    }

    return out;
  }, [query]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleSelect(result: SearchResult) {
    setQuery("");
    setOpen(false);
    if (result.kind === "transaction") router.push("/transactions");
    else router.push("/invoices");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(e.target.value.length > 0);
        }}
        onFocus={() => { if (query.length > 0) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder="Buscar transacciones, facturas…"
        aria-label="Buscar en FlowForge"
        className={cn(
          "h-8 w-52 rounded-input border border-neutral-200 bg-neutral-50 pl-8 pr-3 text-xs text-neutral-900",
          "placeholder:text-neutral-400 outline-none transition-all",
          "focus:w-64 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-500/15",
          "lg:w-60",
          "dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-200 dark:placeholder:text-slate-500",
          "dark:focus:bg-white/[0.08] dark:focus:border-primary-500/60",
        )}
      />

      {/* Dropdown de resultados */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-72 overflow-hidden rounded-card border border-neutral-200 bg-white shadow-elevated dark:border-white/[0.1] dark:bg-[#1C2336] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-xs text-neutral-400 dark:text-neutral-500">
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          ) : (
            <ul role="listbox">
              {results.map((result) => (
                <li key={result.id} role="option" aria-selected={false}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(result)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-white/[0.05]"
                  >
                    <span className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                      result.kind === "transaction"
                        ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                        : "bg-ai-50 text-ai-600 dark:bg-ai-900/30 dark:text-ai-400",
                    )}>
                      {result.kind === "transaction"
                        ? <ArrowLeftRight className="h-3.5 w-3.5" />
                        : <FileText className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-neutral-800 dark:text-neutral-100">
                        {result.label}
                      </span>
                      <span className="block truncate text-[11px] text-neutral-400 dark:text-neutral-500">
                        {result.sub}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              <li className="border-t border-neutral-100 dark:border-white/[0.06]">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setOpen(false);
                    router.push("/transactions");
                  }}
                  className="flex w-full items-center justify-center gap-1.5 px-3 py-2 text-xs text-neutral-400 transition-colors hover:text-primary-600 dark:text-neutral-500 dark:hover:text-primary-400"
                >
                  <Search className="h-3 w-3" />
                  Ver todos los resultados
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Dark mode toggle ──────────────────────────────────────────────────────────

function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useSidebar();

  return (
    <button
      onClick={toggleDarkMode}
      className="relative flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
      aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={darkMode ? "Modo claro" : "Modo oscuro"}
    >
      {darkMode ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

export function Header() {
  const { setMobileOpen } = useSidebar();
  const scrolled = useScrolled();
  const crumbs = useBreadcrumb();
  const hasNotifications = true;

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-14 items-center gap-4 border-b px-4 transition-all duration-200 lg:px-6",
        scrolled
          ? "border-neutral-200 bg-white/90 shadow-subtle backdrop-blur-md dark:border-white/[0.06] dark:bg-[#0D1117]/95 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]"
          : "border-neutral-100 bg-white/80 backdrop-blur-sm dark:border-white/[0.04] dark:bg-[#0D1117]/80",
      )}
    >
      {/* Hamburger — solo mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200 lg:hidden"
        aria-label="Abrir menú de navegación"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb */}
      <nav
        aria-label="Ubicación"
        className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden"
      >
        {crumbs.map((crumb, i) => (
          <span
            key={crumb.href}
            className="flex min-w-0 items-center gap-1.5"
          >
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300 dark:text-neutral-600" />
            )}
            {i < crumbs.length - 1 ? (
              <Link
                href={crumb.href}
                className="truncate text-sm text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Acciones derecha */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Buscador global */}
        <GlobalSearch />

        {/* Dark mode toggle */}
        <DarkModeToggle />

        {/* Notificaciones */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
          aria-label={
            hasNotifications
              ? "Notificaciones — tenés pendientes"
              : "Notificaciones"
          }
        >
          <Bell className="h-[18px] w-[18px]" />
          {hasNotifications && (
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white dark:ring-neutral-900"
            />
          )}
        </button>

        {/* Avatar + dropdown */}
        <UserDropdown />
      </div>
    </header>
  );
}
