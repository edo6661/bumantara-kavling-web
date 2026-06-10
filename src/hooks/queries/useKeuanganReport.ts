import { useQuery } from "@tanstack/react-query";
import {
  reportService,
  type KeuanganReportParams,
} from "../../services/report.service";

export const KEUANGAN_REPORT_KEYS = {
  all: ["keuangan-report"] as const,
  list: (params: KeuanganReportParams) =>
    [...KEUANGAN_REPORT_KEYS.all, params] as const,
};

export const useGetKeuanganReport = (
  params: KeuanganReportParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: KEUANGAN_REPORT_KEYS.list(params),
    queryFn: () => reportService.getKeuangan(params),
    enabled,
  });
};
