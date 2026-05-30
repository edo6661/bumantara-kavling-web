// src/hooks/queries/useCustomerKavling.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerKavlingService } from "../../services/customerKavling.service";
import { BANK_KPR_PEMBAYARAN_KEYS } from "./useBankKprPembayaran";

export const CUSTOMER_KAVLING_KEYS = {
  all: ["customer-kavlings"] as const,
  paginated: (params: Record<string, unknown>) =>
    ["customer-kavlings", "paginated", params] as const,
};

/** Daftar kavling customer lengkap (max 500) — untuk lookup/dropdown. */
export const useGetCustomerKavlings = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: [...CUSTOMER_KAVLING_KEYS.all, params],
    queryFn: () => customerKavlingService.getAll(params),
  });
};

/** Daftar kavling customer dengan pagination, search, sort, dan filter. */
export const useGetCustomerKavlingsPaginated = (
  params: Record<string, unknown>,
) => {
  return useQuery({
    queryKey: CUSTOMER_KAVLING_KEYS.paginated(params),
    queryFn: () => customerKavlingService.getPaginated(params),
  });
};

export const useUpdateCustomerKavling = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string | number;
      data: Record<string, unknown>;
    }) => customerKavlingService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KAVLING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BANK_KPR_PEMBAYARAN_KEYS.all });
    },
  });
};
