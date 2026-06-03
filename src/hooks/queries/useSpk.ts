import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  spkService,
  type CreateSpkDTO,
  type GetSpkParams,
  type UpdateSpkDTO,
} from "../../services/spk.service";
import { PENJUALAN_KEYS } from "./usePenjualan";
import { PROGRESS_PROYEK_KEYS } from "./useProgressProyek";
import { KAVLING_KEYS } from "./useKavling";

export const SPK_KEYS = {
  all: ["spk"] as const,
  list: (params?: GetSpkParams) => [...SPK_KEYS.all, "list", params] as const,
  detail: (id: number) => [...SPK_KEYS.all, id] as const,
};

/** Daftar lengkap (mis. pemetaan kavling di halaman lain). */
export const useGetSpk = (params?: { search?: string; limit?: number }) => {
  return useQuery({
    queryKey: [...SPK_KEYS.all, "all", params],
    queryFn: () => spkService.getAll(params),
  });
};

export const useGetSpkPaginated = (params: GetSpkParams) => {
  return useQuery({
    queryKey: SPK_KEYS.list(params),
    queryFn: () => spkService.getPaginated(params),
  });
};

export const useGetSpkById = (id: number | null) => {
  return useQuery({
    queryKey: SPK_KEYS.detail(id!),
    queryFn: () => spkService.getById(id!),
    enabled: !!id,
  });
};

export const useCreateSpk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSpkDTO) => spkService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: [...SPK_KEYS.all, "list"] });
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROGRESS_PROYEK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: KAVLING_KEYS.all });
    },
  });
};

export const useUpdateSpk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSpkDTO }) =>
      spkService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: [...SPK_KEYS.all, "list"] });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROGRESS_PROYEK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: KAVLING_KEYS.all });
    },
  });
};

export const useDeleteSpk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => spkService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: [...SPK_KEYS.all, "list"] });
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROGRESS_PROYEK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: KAVLING_KEYS.all });
    },
  });
};
