import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tukangService } from '../../services/tukang.service';

export const TUKANG_KEYS = {
  all: ['tukang'] as const,
  list: (search?: string) => [...TUKANG_KEYS.all, 'list', search ?? ''] as const,
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
      queryClient.invalidateQueries({ queryKey: TUKANG_KEYS.all });
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
