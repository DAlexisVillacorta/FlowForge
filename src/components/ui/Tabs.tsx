"use client";

import {
  createContext,
  useContext,
  useState,
  useId,
} from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  active: string;
  setActive: (id: string) => void;
  layoutId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs subcomponents must be inside <Tabs>");
  return ctx;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const layoutId = useId();

  const active = value ?? internal;
  const setActive = (id: string) => {
    if (!value) setInternal(id);
    onValueChange?.(id);
  };

  return (
    <TabsContext.Provider value={{ active, setActive, layoutId }}>
      <div className={cn("flex flex-col", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center border-b border-neutral-200 gap-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export function TabsTrigger({
  value,
  children,
  className,
  disabled = false,
  icon,
  badge,
}: TabsTriggerProps) {
  const { active, setActive, layoutId } = useTabsContext();
  const isActive = active === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && setActive(value)}
      className={cn(
        "relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors duration-150",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset rounded-t-sm",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isActive ? "text-primary-600" : "text-neutral-500 hover:text-neutral-700",
        className,
      )}
    >
      {icon && <span className="h-4 w-4 shrink-0">{icon}</span>}
      {children}
      {badge && <span className="ml-0.5">{badge}</span>}

      {/* Underline indicator animado con layoutId */}
      {isActive && (
        <motion.div
          layoutId={`tab-underline-${layoutId}`}
          className="absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-full bg-primary-500"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { active } = useTabsContext();
  if (active !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn("animate-fade-in pt-4", className)}
    >
      {children}
    </div>
  );
}
