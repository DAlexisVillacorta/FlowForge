"use client";

import { useState, useEffect } from "react";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { MetricsRow } from "@/components/dashboard/MetricsRow";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { CategoryDonutChart } from "@/components/dashboard/CategoryDonutChart";
import { RecentStatements } from "@/components/dashboard/RecentStatements";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";

export default function DashboardPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-400">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <DashboardGreeting />
      <MetricsRow data={data ? { stats: data.stats as { totalProcessed: number; aiAccuracy: number; timeSaved: number; pendingReview: number } } : undefined} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <IncomeExpenseChart data={(data?.monthlyTrends as Array<{ month: string; income: number; expense?: number }>) || []} />
        </div>
        <div className="lg:col-span-2">
          <CategoryDonutChart data={(data?.categoryBreakdown as Array<{ category: string; amount: number; count: number; percentage?: number }>) || []} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentStatements data={(data?.recentStatements as Array<{ id: string; bankAccount?: { bankName: string }; periodStart: Date; status: string; matchedCount: number; transactionCount: number }>) || []} />
        <ActivityTimeline data={(data?.recentActivity as Array<{ id: string; type: string; description: string; timestamp: Date | string; meta?: Record<string, unknown> }>) || []} />
      </div>
    </div>
  );
}
