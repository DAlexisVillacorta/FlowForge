"use client";

import { Skeleton } from "./Skeleton";

// ── Table skeleton ────────────────────────────────────────────────────────────

function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      {/* Header */}
      <div className="flex gap-4 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 dark:border-neutral-700 dark:bg-neutral-800/60">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${60 + i * 10}px`} height={12} />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-neutral-50 dark:divide-neutral-700/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton variant="rect" width={52} height={28} />
            <Skeleton variant="text" width="15%" height={14} />
            <Skeleton variant="text" width="22%" height={14} />
            <Skeleton variant="text" width="12%" height={14} />
            {cols > 4 && <Skeleton variant="text" width="10%" height={14} />}
            <div className="ml-auto flex items-center gap-2">
              <Skeleton variant="rect" width={64} height={22} className="rounded-full" />
              <Skeleton variant="circular" width={28} height={28} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Card grid skeleton ────────────────────────────────────────────────────────

function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"
        >
          <div className="mb-3 flex items-center justify-between">
            <Skeleton variant="text" width="55%" height={13} />
            <Skeleton variant="circular" width={32} height={32} />
          </div>
          <Skeleton variant="text" width="70%" height={28} className="mb-1" />
          <Skeleton variant="text" width="45%" height={12} />
        </div>
      ))}
    </div>
  );
}

// ── Chart skeleton ────────────────────────────────────────────────────────────

function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
      <Skeleton variant="text" width="40%" height={16} className="mb-1" />
      <Skeleton variant="text" width="25%" height={12} className="mb-4" />
      <Skeleton variant="rect" height={height} className="rounded-lg" />
    </div>
  );
}

// ── PageLoader variants ───────────────────────────────────────────────────────

export type PageLoaderVariant =
  | "dashboard"
  | "table"
  | "settings"
  | "default";

interface PageLoaderProps {
  variant?: PageLoaderVariant;
}

export function PageLoader({ variant = "default" }: PageLoaderProps) {
  if (variant === "dashboard") {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton variant="text" width={280} height={32} />
            <Skeleton variant="text" width={180} height={14} />
          </div>
          <Skeleton variant="rect" width={140} height={36} className="rounded-input" />
        </div>
        {/* Metric cards */}
        <CardGridSkeleton count={4} />
        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <ChartSkeleton height={260} />
          <ChartSkeleton height={260} />
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton variant="text" width={260} height={32} />
            <Skeleton variant="text" width={160} height={14} />
          </div>
          <Skeleton variant="rect" width={140} height={36} className="rounded-input" />
        </div>
        {/* Filters */}
        <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex gap-3">
            {[80, 100, 110, 90].map((w, i) => (
              <Skeleton key={i} variant="rect" width={w} height={32} className="rounded-full" />
            ))}
          </div>
        </div>
        <TableSkeleton rows={8} cols={5} />
      </div>
    );
  }

  if (variant === "settings") {
    return (
      <div className="flex gap-6 animate-pulse">
        {/* Sidebar */}
        <div className="hidden w-56 shrink-0 lg:block">
          <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                <Skeleton variant="rect" width={28} height={28} className="rounded-lg" />
                <Skeleton variant="text" width="60%" height={13} />
              </div>
            ))}
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
            <Skeleton variant="text" width={200} height={20} className="mb-4" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton variant="text" width="40%" height={13} />
                  <Skeleton variant="rect" height={36} className="rounded-input" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // default
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <Skeleton variant="text" width={240} height={32} />
        <Skeleton variant="text" width={160} height={14} />
      </div>
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
