// src/hooks/queries/useCustomerKavling.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerKavlingService } from "../../services/customerKavling.service";

export const CUSTOMER_KAVLING_KEYS = {
  all: ["customer-kavlings"] as const,
};

export const useGetCustomerKavlings = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: [...CUSTOMER_KAVLING_KEYS.all, params],
    queryFn: () => customerKavlingService.getAll(params),
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
    },
  });
};
