import { useQuery } from "@tanstack/react-query";
import {
  reportService,
  type ProgressProyekReportParams,
} from "../../services/report.service";

export const PROGRESS_PROYEK_REPORT_KEYS = {
  all: ["progress-proyek-report"] as const,
  list: (params: ProgressProyekReportParams) =>
    [...PROGRESS_PROYEK_REPORT_KEYS.all, params] as const,
};

export const useGetProgressProyekReport = (
  params: ProgressProyekReportParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: PROGRESS_PROYEK_REPORT_KEYS.list(params),
    queryFn: () => reportService.getProgressProyek(params),
    enabled,
  });
};
