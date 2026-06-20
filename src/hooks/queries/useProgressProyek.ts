import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  progressProyekService,
  type UpdateProgressProyekDTO,
} from "../../services/progressProyek.service";
import { PENJUALAN_KEYS } from "./usePenjualan";
import { SPK_KEYS } from "./useSpk";

export type ProgressProyekScope =
  | { penjualanId: number }
  | { kavlingId: number };

export const PROGRESS_PROYEK_KEYS = {
  all: ["progress-proyek"] as const,
  mandors: ["progress-proyek", "mandors"] as const,
  proyekList: (params?: Record<string, unknown>) =>
    [...PROGRESS_PROYEK_KEYS.all, "proyek", params] as const,
  detail: (scope: ProgressProyekScope) =>
    "penjualanId" in scope
      ? ([...PROGRESS_PROYEK_KEYS.all, "penjualan", scope.penjualanId] as const)
      : ([...PROGRESS_PROYEK_KEYS.all, "kavling", scope.kavlingId] as const),
};

export const useGetProgressProyekList = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: PROGRESS_PROYEK_KEYS.proyekList(params),
    queryFn: () => progressProyekService.getProyekList(params),
  });
};

export const useGetMandors = () => {
  return useQuery({
    queryKey: PROGRESS_PROYEK_KEYS.mandors,
    queryFn: () => progressProyekService.getMandors(),
  });
};

export const useGetProgressProyek = (scope: ProgressProyekScope | null) => {
  return useQuery({
    queryKey: scope ? PROGRESS_PROYEK_KEYS.detail(scope) : ["progress-proyek", "none"],
    queryFn: () =>
      scope && "penjualanId" in scope
        ? progressProyekService.getById(scope.penjualanId)
        : progressProyekService.getByKavlingId(scope!.kavlingId),
    enabled: !!scope,
  });
};

export const useUpdateProgressProyek = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      scope,
      data,
    }: {
      scope: ProgressProyekScope & { penjualanId: number };
      data: UpdateProgressProyekDTO;
    }) => progressProyekService.update(scope.penjualanId, data),
    onSuccess: (_, variables) => {
      invalidateProgressDetail(queryClient, variables.scope);
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROGRESS_PROYEK_KEYS.all });
    },
  });
};

const invalidateProgressDetail = (
  queryClient: ReturnType<typeof useQueryClient>,
  scope: ProgressProyekScope,
) => {
  queryClient.invalidateQueries({
    queryKey: PROGRESS_PROYEK_KEYS.detail(scope),
  });
};

export const useUploadTahapanPhotos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      scope,
      namaTahapan,
      files,
    }: {
      scope: ProgressProyekScope & { penjualanId: number };
      namaTahapan: string;
      files: File[];
    }) =>
      progressProyekService.uploadTahapanPhotos(
        scope.penjualanId,
        namaTahapan,
        files,
      ),
    onSuccess: (_, variables) => {
      invalidateProgressDetail(queryClient, variables.scope);
      queryClient.invalidateQueries({ queryKey: PROGRESS_PROYEK_KEYS.all });
    },
  });
};

export const useAddTahapanLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      scope: ProgressProyekScope;
      namaTahapan: string;
      persentase: number;
      deskripsi: string;
      tanggal: string;
      files: File[];
    }) => {
      const payload = {
        namaTahapan: data.namaTahapan,
        persentase: data.persentase,
        deskripsi: data.deskripsi,
        tanggal: data.tanggal,
        files: data.files,
      };
      return "penjualanId" in data.scope
        ? progressProyekService.addTahapanLog(data.scope.penjualanId, payload)
        : progressProyekService.addTahapanLogByKavling(
            data.scope.kavlingId,
            payload,
          );
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(PROGRESS_PROYEK_KEYS.detail(variables.scope), data);
      invalidateProgressDetail(queryClient, variables.scope);
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROGRESS_PROYEK_KEYS.all });
    },
  });
};

export const useSetTotalProgressByKavling = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { kavlingId: number; persentase: number }) =>
      progressProyekService.setTotalByKavling(payload.kavlingId, payload.persentase),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        PROGRESS_PROYEK_KEYS.detail({ kavlingId: variables.kavlingId }),
        data,
      );
      if (data.penjualanId != null) {
        queryClient.setQueryData(
          PROGRESS_PROYEK_KEYS.detail({ penjualanId: data.penjualanId }),
          data,
        );
      }
      queryClient.invalidateQueries({ queryKey: PROGRESS_PROYEK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
    },
  });
};

export const useResetTotalProgressByKavling = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { kavlingId: number }) =>
      progressProyekService.resetTotalByKavling(payload.kavlingId),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        PROGRESS_PROYEK_KEYS.detail({ kavlingId: variables.kavlingId }),
        data,
      );
      if (data.penjualanId != null) {
        queryClient.setQueryData(
          PROGRESS_PROYEK_KEYS.detail({ penjualanId: data.penjualanId }),
          data,
        );
      }
      queryClient.invalidateQueries({ queryKey: PROGRESS_PROYEK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
    },
  });
};
