import { useQuery } from "@tanstack/react-query";
import {
  reportService,
  type MarketingReportParams,
} from "../../services/report.service";

export const MARKETING_REPORT_KEYS = {
  all: ["marketing-report"] as const,
  list: (params: MarketingReportParams) =>
    [...MARKETING_REPORT_KEYS.all, params] as const,
};

export const useGetMarketingReport = (
  params: MarketingReportParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: MARKETING_REPORT_KEYS.list(params),
    queryFn: () => reportService.getMarketing(params),
    enabled,
  });
};
