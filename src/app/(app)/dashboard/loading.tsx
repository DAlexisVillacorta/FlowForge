import { PageLoader } from "@/components/ui/PageLoader";

export default function DashboardLoading() {
  return (
    <div className="py-2">
      <PageLoader variant="dashboard" />
    </div>
  );
}
