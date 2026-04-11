import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  penjualanService,
  type CreatePenjualanDTO,
} from "../../services/penjualan.service";

export const PENJUALAN_KEYS = {
  all: ["penjualan"] as const,
};

export const useGetPenjualan = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: [...PENJUALAN_KEYS.all, params],
    queryFn: () => penjualanService.getAll(params),
  });
};

export const useCreatePenjualan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePenjualanDTO) => penjualanService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
    },
  });
};
