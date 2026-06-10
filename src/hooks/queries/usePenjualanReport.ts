import { useQuery } from "@tanstack/react-query";
import {
  reportService,
  type PenjualanReportParams,
} from "../../services/report.service";

export const PENJUALAN_REPORT_KEYS = {
  all: ["penjualan-report"] as const,
  list: (params: PenjualanReportParams) =>
    [...PENJUALAN_REPORT_KEYS.all, params] as const,
};

export const useGetPenjualanReport = (
  params: PenjualanReportParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: PENJUALAN_REPORT_KEYS.list(params),
    queryFn: () => reportService.getPenjualan(params),
    enabled,
  });
};
