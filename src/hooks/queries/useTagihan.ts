import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  tagihanService,
  type CreateTagihanDTO,
  type UpdateTagihanDTO,
} from "../../services/tagihan.service";

export const TAGIHAN_KEYS = {
  all: ["tagihans"] as const,
  lists: () => [...TAGIHAN_KEYS.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...TAGIHAN_KEYS.lists(), filters] as const,
  details: () => [...TAGIHAN_KEYS.all, "detail"] as const,
  detail: (id: number) => [...TAGIHAN_KEYS.details(), id] as const,
};

export const useGetTagihans = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: TAGIHAN_KEYS.list(params || {}),
    queryFn: () => tagihanService.getAll(params),
  });
};

export const useGetTagihanById = (id: number, enabled = true) => {
  return useQuery({
    queryKey: TAGIHAN_KEYS.detail(id),
    queryFn: () => tagihanService.getById(id),
    enabled: !!id && enabled,
  });
};

export const useCreateTagihan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTagihanDTO) => tagihanService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGIHAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["customer-kavlings"] });
      queryClient.invalidateQueries({ queryKey: ["penjualan"] });
    },
  });
};

export const useUpdateTagihan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTagihanDTO }) =>
      tagihanService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGIHAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["customer-kavlings"] });
      queryClient.invalidateQueries({ queryKey: ["penjualan"] });
    },
  });
};

export const useDeleteTagihan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tagihanService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGIHAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["customer-kavlings"] });
      queryClient.invalidateQueries({ queryKey: ["penjualan"] });
    },
  });
};

export const useUploadBuktiTagihan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      tagihanService.uploadBukti(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGIHAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["penjualan"] });
      queryClient.invalidateQueries({ queryKey: ["customer-kavlings"] });
    },
  });
};

export const useUploadRefundTagihan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      tagihanService.uploadRefund(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGIHAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["penjualan"] });
    },
  });
};

export const useUploadTagihanSignature = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      noTagihanId: number;
      signatureBase64: string;
      nama: string;
      peran: string;
      tanggal: string;
    }) => tagihanService.uploadSignature(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGIHAN_KEYS.all });
    },
  });
};

export const useApproveTagihan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isApproved }: { id: number; isApproved: boolean }) =>
      tagihanService.approveBukti(id, isApproved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGIHAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["penjualan"] });
    },
  });
};
