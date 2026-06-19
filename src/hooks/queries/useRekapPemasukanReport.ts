import { useQuery } from '@tanstack/react-query';
import {
  reportService,
  type RekapPemasukanReportParams,
} from '../../services/report.service';

export const REKAP_PEMASUKAN_REPORT_KEYS = {
  all: ['rekap-pemasukan-report'] as const,
  list: (params: RekapPemasukanReportParams) =>
    [...REKAP_PEMASUKAN_REPORT_KEYS.all, params] as const,
};

export const useGetRekapPemasukanReport = (
  params: RekapPemasukanReportParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: REKAP_PEMASUKAN_REPORT_KEYS.list(params),
    queryFn: () => reportService.getRekapPemasukan(params),
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};
