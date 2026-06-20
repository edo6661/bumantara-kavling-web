import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  progressPenjualanService,
  type UpdateProgressPenjualanDTO,
} from "../../services/progressPenjualan.service";
import { PENJUALAN_KEYS } from "./usePenjualan";
export const PROGRESS_PENJUALAN_KEYS = {
  all: ["progress-penjualan"] as const,
  detail: (penjualanId: number) =>
    [...PROGRESS_PENJUALAN_KEYS.all, penjualanId] as const,
};
export const useGetProgressPenjualan = (penjualanId: number | null) => {
  return useQuery({
    queryKey: PROGRESS_PENJUALAN_KEYS.detail(penjualanId!),
    queryFn: () => progressPenjualanService.getById(penjualanId!),
    enabled: !!penjualanId,
  });
};
export const useUpdateProgressPenjualan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateProgressPenjualanDTO;
    }) => progressPenjualanService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PROGRESS_PENJUALAN_KEYS.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
    },
  });
};
export const useUploadProgressDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      docType,
      file,
      sertifikatUrutan,
    }: {
      id: number;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      docType: any;
      file: File;
      sertifikatUrutan?: number;
    }) =>
      progressPenjualanService.uploadDocument(
        id,
        docType,
        file,
        sertifikatUrutan,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PROGRESS_PENJUALAN_KEYS.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
    },
  });
};

export const useDeleteProgressDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      docType,
      sertifikatUrutan,
    }: {
      id: number;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      docType: any;
      sertifikatUrutan?: number;
    }) =>
      progressPenjualanService.deleteDocument(
        id,
        docType,
        sertifikatUrutan,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PROGRESS_PENJUALAN_KEYS.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
    },
  });
};
