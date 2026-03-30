import type { Metadata } from "next";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { MetricsRow } from "@/components/dashboard/MetricsRow";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { CategoryDonutChart } from "@/components/dashboard/CategoryDonutChart";
import { RecentStatements } from "@/components/dashboard/RecentStatements";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";

export const metadata: Metadata = {
  title: "Panel principal — FlowForge",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-8">
      {/* Saludo + CTA */}
      <DashboardGreeting />

      {/* Métricas principales */}
      <MetricsRow />

      {/* Gráficos — 60/40 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <IncomeExpenseChart />
        </div>
        <div className="lg:col-span-2">
          <CategoryDonutChart />
        </div>
      </div>

      {/* Extractos + Actividad — 50/50 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentStatements />
        <ActivityTimeline />
      </div>
    </div>
  );
}
