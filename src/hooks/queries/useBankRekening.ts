// src/hooks/queries/useBankRekening.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bankRekeningService,
  type CreateBankRekeningPtDTO,
} from "../../services/bankRekening.service";

export const BANK_KEYS = {
  all: ["bank-rekenings"] as const,
};

export const useGetBankRekening = () => {
  return useQuery({
    queryKey: BANK_KEYS.all,
    queryFn: bankRekeningService.getAll,
  });
};

export const useCreateBankRekening = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBankRekeningPtDTO) =>
      bankRekeningService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_KEYS.all });
    },
  });
};

export const useUpdateBankRekening = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateBankRekeningPtDTO>;
    }) => bankRekeningService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_KEYS.all });
    },
  });
};

export const useDeleteBankRekening = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bankRekeningService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_KEYS.all });
    },
  });
};
