import { useQuery } from "@tanstack/react-query";
import {
  reportService,
  type BiayaProyekReportParams,
} from "../../services/report.service";

export const BIAYA_PROYEK_REPORT_KEYS = {
  all: ["biaya-proyek-report"] as const,
  list: (params: BiayaProyekReportParams) =>
    [...BIAYA_PROYEK_REPORT_KEYS.all, params] as const,
};

export const useGetBiayaProyekReport = (
  params: BiayaProyekReportParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: BIAYA_PROYEK_REPORT_KEYS.list(params),
    queryFn: () => reportService.getBiayaProyek(params),
    enabled,
  });
};
