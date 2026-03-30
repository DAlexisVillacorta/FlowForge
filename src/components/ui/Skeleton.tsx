"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  variant?: "text" | "circular" | "rect";
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number; // para variant="text" con múltiples líneas
}

export function Skeleton({
  variant = "rect",
  width,
  height,
  className,
  lines,
}: SkeletonProps) {
  const base = "skeleton";

  const variants = {
    text: "h-4 rounded w-full",
    circular: "rounded-full",
    rect: "rounded-card",
  };

  const style: React.CSSProperties = {
    width: width !== undefined ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === "number" ? `${height}px` : height) : undefined,
  };

  // Multiline text skeleton
  if (variant === "text" && lines && lines > 1) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(base, variants.text, i === lines - 1 ? "w-3/4" : "w-full")}
            style={style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(base, variants[variant], className)}
      style={style}
    />
  );
}

// Preset para fila de tabla
export function SkeletonRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-neutral-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton
            variant="text"
            width={i === 0 ? "60%" : i === columns - 1 ? "40%" : "80%"}
          />
        </td>
      ))}
    </tr>
  );
}

// Preset para card
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-card border border-neutral-200 bg-white p-5 shadow-subtle", className)}>
      <div className="mb-3 flex items-center gap-3">
        <Skeleton variant="circular" width={36} height={36} />
        <div className="flex-1">
          <Skeleton variant="text" width="50%" className="mb-1.5" />
          <Skeleton variant="text" width="30%" height={12} />
        </div>
      </div>
      <Skeleton variant="text" lines={2} />
      <div className="mt-4">
        <Skeleton variant="rect" height={32} />
      </div>
    </div>
  );
}
