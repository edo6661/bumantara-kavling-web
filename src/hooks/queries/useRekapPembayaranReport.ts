import { useQuery } from "@tanstack/react-query";
import {
  reportService,
  type RekapPembayaranReportParams,
} from "../../services/report.service";

export const REKAP_PEMBAYARAN_REPORT_KEYS = {
  all: ["rekap-pembayaran-report"] as const,
  list: (params: RekapPembayaranReportParams) =>
    [...REKAP_PEMBAYARAN_REPORT_KEYS.all, params] as const,
};

export const useGetRekapPembayaranReport = (
  params: RekapPembayaranReportParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: REKAP_PEMBAYARAN_REPORT_KEYS.list(params),
    queryFn: () => reportService.getRekapPembayaran(params),
    enabled,
  });
};
