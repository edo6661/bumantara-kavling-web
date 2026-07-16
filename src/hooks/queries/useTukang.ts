import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tukangService } from '../../services/tukang.service';
import { SPK_PEMBAYARAN_KEYS } from './useSpkPembayaran';

export const TUKANG_KEYS = {
  all: ['tukang'] as const,
  list: (search?: string) => [...TUKANG_KEYS.all, 'list', search ?? ''] as const,
};

const invalidateTukangRelated = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: TUKANG_KEYS.all });
  // NIK/nama di Upah diambil dari master (+ snapshot sync) — refresh daftar upah.
  queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.all });
};

export const useGetTukangList = (search?: string, enabled = true) => {
  return useQuery({
    queryKey: TUKANG_KEYS.list(search),
    queryFn: () => tukangService.getList(search),
    enabled,
  });
};

export const useUpsertTukang = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tukangService.upsert,
    onSuccess: () => {
      invalidateTukangRelated(queryClient);
    },
  });
};

export const useUploadTukangKtp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nik, file }: { nik: string; file: File }) =>
      tukangService.uploadKtp(nik, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TUKANG_KEYS.all });
    },
  });
};

export const useDeleteTukang = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tukangService.delete(id),
    onSuccess: () => {
      invalidateTukangRelated(queryClient);
    },
  });
};
