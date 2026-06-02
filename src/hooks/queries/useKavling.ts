import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  kavlingService,
  type CreateKavlingDTO,
  type GetKavlingParams,
} from "../../services/kavling.service";

export const KAVLING_KEYS = {
  all: ["kavlings"] as const,
  list: (params: GetKavlingParams) => ["kavlings", params] as const,
};

export const useGetKavlings = (params: GetKavlingParams = {}) => {
  return useQuery({
    queryKey: KAVLING_KEYS.list(params),
    queryFn: () => kavlingService.getAll(params),
  });
};

export const useCreateKavling = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newData: CreateKavlingDTO) => kavlingService.create(newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KAVLING_KEYS.all });
    },
  });
};

export const useUpdateKavling = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateKavlingDTO>;
    }) => kavlingService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KAVLING_KEYS.all });
    },
  });
};

export const useDeleteKavling = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => kavlingService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KAVLING_KEYS.all });
    },
  });
};

export const useUploadKavlingDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      docType,
      file,
    }: {
      id: number;
      docType: string;
      file: File;
    }) => kavlingService.uploadDocument(id, docType, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KAVLING_KEYS.all });
    },
  });
};

export const useUploadKavlingSertifikatTambahanDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      urutan,
      docType,
      file,
    }: {
      id: number;
      urutan: number;
      docType: string;
      file: File;
    }) => kavlingService.uploadSertifikatTambahanDocument(id, urutan, docType, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KAVLING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["penjualan"] });
    },
  });
};
