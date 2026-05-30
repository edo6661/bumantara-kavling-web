import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  notarisPembayaranService,
  type NotarisPembayaranListParams,
} from '../../services/notarisPembayaran.service';

export const NOTARIS_PEMBAYARAN_KEYS = {
  all: ['notaris-pembayaran'] as const,
  list: (params?: NotarisPembayaranListParams) =>
    [...NOTARIS_PEMBAYARAN_KEYS.all, 'list', params] as const,
};

export const useGetNotarisPembayaranList = (params: NotarisPembayaranListParams) => {
  return useQuery({
    queryKey: NOTARIS_PEMBAYARAN_KEYS.list(params),
    queryFn: () => notarisPembayaranService.getPaginated(params),
  });
};

export const useBayarNotarisPembayaran = () => {
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
    }) => notarisPembayaranService.bayar(id, file, tanggalPembayaran),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTARIS_PEMBAYARAN_KEYS.all });
    },
  });
};

export const useSetNotarisBsiCmsDilaporkan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, dilaporkan }: { ids: number[]; dilaporkan: boolean }) =>
      notarisPembayaranService.setBsiCmsDilaporkan(ids, dilaporkan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTARIS_PEMBAYARAN_KEYS.all });
    },
  });
};
