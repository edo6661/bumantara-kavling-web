import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../../services/dashboard.service";

export const DASHBOARD_KEYS = {
  summary: ["dashboard-summary"] as const,
};

export const useGetDashboardSummary = () => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.summary,
    queryFn: dashboardService.getSummary,
  });
};
