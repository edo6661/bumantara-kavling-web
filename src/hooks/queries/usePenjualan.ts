import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  penjualanService,
  type CreatePenjualanDTO,
} from "../../services/penjualan.service";

export const PENJUALAN_KEYS = {
  all: ["penjualan"] as const,
  pengajuanBatal: ["pengajuan-batal"] as const,
  pengajuanGantiKavling: ["pengajuan-ganti-kavling"] as const,
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
      queryClient.invalidateQueries({ queryKey: ["tagihans"] });
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

export const useUpdateBatalPenjualan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { agent?: string; bookingFeeLunasBatal?: boolean };
    }) => penjualanService.updateBatal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["fee-agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent-pencairan"] });
    },
  });
};

export const useCreateManualBatalPenjualan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      customerId: number;
      blok: string;
      nomorUnit: string;
      agent: string;
      alasanBatal?: string;
      bookingFeeLunasBatal?: boolean;
      tanggal?: string;
    }) => penjualanService.createManualBatal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["fee-agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent-pencairan"] });
    },
  });
};

export const useGantiKavling = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { kavlingBaruId: number; alasan: string };
    }) => penjualanService.gantiKavling(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["kavlings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
};

export const useGetPengajuanBatal = (status?: string) => {
  return useQuery({
    queryKey: [...PENJUALAN_KEYS.pengajuanBatal, status],
    queryFn: () => penjualanService.getPengajuanBatal(status),
  });
};

export const useGetPengajuanGantiKavling = (status?: string) => {
  return useQuery({
    queryKey: [...PENJUALAN_KEYS.pengajuanGantiKavling, status],
    queryFn: () => penjualanService.getPengajuanGantiKavling(status),
  });
};

export const useApproveBatal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isApproved }: { id: number; isApproved: boolean }) =>
      penjualanService.approveBatal(id, isApproved),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PENJUALAN_KEYS.pengajuanBatal,
      });
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["kavlings"] });
      queryClient.invalidateQueries({ queryKey: ["tagihans"] });
    },
  });
};

export const useApproveGantiKavling = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isApproved }: { id: number; isApproved: boolean }) =>
      penjualanService.approveGantiKavling(id, isApproved),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PENJUALAN_KEYS.pengajuanGantiKavling,
      });
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["kavlings"] });
    },
  });
};

export const useRegenerateSpr = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => penjualanService.regenerateSpr(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
    },
  });
};

export const useLunaskanBookingFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => penjualanService.lunaskanBookingFee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["tagihans"] });
      queryClient.invalidateQueries({ queryKey: ["customer-kavlings"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["fee-agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent-pencairan"] });
    },
  });
};
