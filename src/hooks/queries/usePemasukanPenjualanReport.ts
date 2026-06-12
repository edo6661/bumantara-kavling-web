import { useQuery } from '@tanstack/react-query';
import {
  reportService,
  type PemasukanPenjualanReportParams,
} from '../../services/report.service';

export const PEMASUKAN_PENJUALAN_REPORT_KEYS = {
  all: ['pemasukan-penjualan-report'] as const,
  list: (params: PemasukanPenjualanReportParams) =>
    [...PEMASUKAN_PENJUALAN_REPORT_KEYS.all, params] as const,
};

export const useGetPemasukanPenjualanReport = (
  params: PemasukanPenjualanReportParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: PEMASUKAN_PENJUALAN_REPORT_KEYS.list(params),
    queryFn: () => reportService.getPemasukanPenjualan(params),
    enabled,
  });
};
