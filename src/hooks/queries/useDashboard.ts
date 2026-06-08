import { useQuery } from "@tanstack/react-query";
import {
  dashboardService,
  type DashboardDrilldownCategory,
  type DashboardQueryParams,
} from "../../services/dashboard.service";

export const DASHBOARD_KEYS = {
  summary: (params: DashboardQueryParams) => ["dashboard-summary", params] as const,
  drilldown: (category: DashboardDrilldownCategory, filter?: string, blok?: string) =>
    ["dashboard-drilldown", category, filter, blok] as const,
};

export const useGetDashboardSummary = (params: DashboardQueryParams = {}) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.summary(params),
    queryFn: () => dashboardService.getSummary(params),
  });
};

export const useGetDashboardDrilldown = (
  category: DashboardDrilldownCategory | null,
  filter?: string,
  blok?: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.drilldown(category!, filter, blok),
    queryFn: () => dashboardService.getDrilldown(category!, filter, blok),
    enabled: enabled && category !== null,
  });
};
