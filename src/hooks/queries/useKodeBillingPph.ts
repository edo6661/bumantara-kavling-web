import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  kodeBillingPphService,
  type KodeBillingPphData,
} from "../../services/kodeBillingPph.service";
import { invalidateSidebarBadges } from "./useSidebarBadges";

export const kodeBillingPphPenjualanQueryKey = (penjualanId: number) =>
  ["kode-billing-pph", "penjualan", penjualanId] as const;

export const useGetKodeBillingPph = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ["kode-billing-pph", "list", params],
    queryFn: () => kodeBillingPphService.getAll(params),
    enabled: !!params,
  });
};

export const kodeBillingPphPenjualanAllQueryKey = (penjualanId: number) =>
  ["kode-billing-pph", "penjualan", penjualanId, "all"] as const;

export const useGetKodeBillingPphByPenjualan = (
  penjualanId: number | null | undefined,
) => {
  const id =
    penjualanId != null && !Number.isNaN(Number(penjualanId))
      ? Number(penjualanId)
      : null;
  return useQuery({
    queryKey:
      id != null && id > 0
        ? kodeBillingPphPenjualanQueryKey(id)
        : (["kode-billing-pph", "penjualan", "idle"] as const),
    queryFn: () => kodeBillingPphService.getByPenjualan(id!),
    enabled: id != null && id > 0,
    refetchOnMount: "always",
  });
};

export const useGetAllKodeBillingPphByPenjualan = (
  penjualanId: number | null | undefined,
) => {
  const id =
    penjualanId != null && !Number.isNaN(Number(penjualanId))
      ? Number(penjualanId)
      : null;
  return useQuery({
    queryKey:
      id != null && id > 0
        ? kodeBillingPphPenjualanAllQueryKey(id)
        : (["kode-billing-pph", "penjualan", "all", "idle"] as const),
    queryFn: () => kodeBillingPphService.getAllByPenjualan(id!),
    enabled: id != null && id > 0,
    refetchOnMount: "always",
  });
};

export const useUploadKodeBillingPph = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kodeBillingPphService.uploadBilling,
    onSuccess: (data, variables) => {
      const penjualanId = Number(variables.penjualanId);
      const urutan = variables.sertifikatUrutan ?? 1;
      if (urutan === 1) {
        queryClient.setQueryData<KodeBillingPphData | null>(
          kodeBillingPphPenjualanQueryKey(penjualanId),
          data,
        );
      }
      queryClient.invalidateQueries({
        queryKey: kodeBillingPphPenjualanAllQueryKey(penjualanId),
      });
      // Jangan refetch query penjualan — bisa menimpa fileBilling dari respons upload
      queryClient.invalidateQueries({
        queryKey: ["kode-billing-pph", "list"],
      });
      invalidateSidebarBadges(queryClient);
    },
  });
};

export const useUploadBuktiBayarKodeBillingPph = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      kodeBillingPphService.uploadBuktiBayar(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kode-billing-pph"] });
      invalidateSidebarBadges(queryClient);
    },
  });
};
