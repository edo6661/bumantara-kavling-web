import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bankKprPembayaranService,
  type BankKprPembayaranListParams,
} from '../../services/bankKprPembayaran.service';

export const BANK_KPR_PEMBAYARAN_KEYS = {
  all: ['bank-kpr-pembayaran'] as const,
  list: (params?: BankKprPembayaranListParams) =>
    [...BANK_KPR_PEMBAYARAN_KEYS.all, 'list', params] as const,
};

export const useGetBankKprPembayaranList = (params: BankKprPembayaranListParams) => {
  return useQuery({
    queryKey: BANK_KPR_PEMBAYARAN_KEYS.list(params),
    queryFn: () => bankKprPembayaranService.getPaginated(params),
  });
};

export const useBayarBankKprPembayaran = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      file,
      tanggalPembayaran,
    }: {
      id: number;
      file: File;
      tanggalPembayaran?: string;
    }) => bankKprPembayaranService.bayar(id, file, tanggalPembayaran),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_KPR_PEMBAYARAN_KEYS.all });
    },
  });
};

export const useSetBankKprBsiCmsDilaporkan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, dilaporkan }: { ids: number[]; dilaporkan: boolean }) =>
      bankKprPembayaranService.setBsiCmsDilaporkan(ids, dilaporkan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_KPR_PEMBAYARAN_KEYS.all });
    },
  });
};

/** Sementara: backfill pembayaran bank KPR. */
export const useSyncAllBankKprPembayaran = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => bankKprPembayaranService.syncAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_KPR_PEMBAYARAN_KEYS.all });
    },
  });
};
