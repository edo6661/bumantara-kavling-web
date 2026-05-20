import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  progressProyekService,
  type UpdateProgressProyekDTO,
} from "../../services/progressProyek.service";
import { PENJUALAN_KEYS } from "./usePenjualan";

export const PROGRESS_PROYEK_KEYS = {
  all: ["progress-proyek"] as const,
  detail: (penjualanId: number) =>
    [...PROGRESS_PROYEK_KEYS.all, penjualanId] as const,
};

export const useGetProgressProyek = (penjualanId: number | null) => {
  return useQuery({
    queryKey: PROGRESS_PROYEK_KEYS.detail(penjualanId!),
    queryFn: () => progressProyekService.getById(penjualanId!),
    enabled: !!penjualanId,
  });
};

export const useUpdateProgressProyek = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProgressProyekDTO }) =>
      progressProyekService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PROGRESS_PROYEK_KEYS.detail(variables.id),
      });

      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
    },
  });
};

export const useUploadTahapanPhotos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      namaTahapan,
      files,
    }: {
      id: number;
      namaTahapan: string;
      files: File[];
    }) => progressProyekService.uploadTahapanPhotos(id, namaTahapan, files),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PROGRESS_PROYEK_KEYS.detail(variables.id),
      });
    },
  });
};

export const useAddTahapanLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: number;
      namaTahapan: string;
      persentase: number;
      deskripsi: string;
      tanggal: string;
      files: File[];
    }) => progressProyekService.addTahapanLog(data.id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PROGRESS_PROYEK_KEYS.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
    },
  });
};
