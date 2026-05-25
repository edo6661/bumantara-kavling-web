import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { kodeBillingPphService } from "../../services/kodeBillingPph.service";

export const useGetKodeBillingPph = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ["kode-billing-pph", params],
    queryFn: () => kodeBillingPphService.getAll(params),
    enabled: !!params,
  });
};

export const useUploadKodeBillingPph = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kodeBillingPphService.uploadBilling,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kode-billing-pph"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
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
    },
  });
};
