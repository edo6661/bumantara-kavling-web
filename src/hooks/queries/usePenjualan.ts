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
      queryClient.invalidateQueries({ queryKey: ["tagihans"] });
      queryClient.invalidateQueries({ queryKey: ["customer-kavlings"] });
      queryClient.invalidateQueries({ queryKey: ["kavlings"] });
    },
  });
};

export const useCancelPenjualan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, alasanBatal }: { id: string; alasanBatal: string }) =>
      penjualanService.cancel(id, alasanBatal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["kavlings"] });
      queryClient.invalidateQueries({ queryKey: ["tagihans"] }); // Tambahkan ini agar Tagihan yang batal ikut hilang
      queryClient.invalidateQueries({ queryKey: ["customer-kavlings"] });
    },
  });
};

export const useUploadBuktiPenjualan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      type,
      file,
    }: {
      id: string;
      type: "booking" | "dp";
      file: File;
    }) => penjualanService.uploadBukti(id, type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["tagihans"] });
      queryClient.invalidateQueries({ queryKey: ["customer-kavlings"] });
    },
  });
};

export const useUploadSignature = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      noTransaksi: string;
      signatureBase64: string;
      nama: string;
      peran: string;
      tanggal: string;
    }) => penjualanService.uploadSignature(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
    },
  });
};

export const useUpdatePenjualan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreatePenjualanDTO>;
    }) => penjualanService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["tagihans"] });
      queryClient.invalidateQueries({ queryKey: ["customer-kavlings"] });
      queryClient.invalidateQueries({ queryKey: ["kavlings"] });
    },
  });
};
