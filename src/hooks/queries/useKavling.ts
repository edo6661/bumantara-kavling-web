import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  kavlingService,
  type KavlingData,
} from "../../services/kavling.service";

export const KAVLING_KEYS = {
  all: ["kavlings"] as const,
  detail: (id: string) => ["kavlings", id] as const,
};

export const useGetKavlings = () => {
  return useQuery({
    queryKey: KAVLING_KEYS.all,
    queryFn: kavlingService.getAll,
  });
};

export const useCreateKavling = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newData: Omit<KavlingData, "id">) =>
      kavlingService.create(newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KAVLING_KEYS.all });
    },
  });
};

export const useDeleteKavling = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => kavlingService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KAVLING_KEYS.all });
    },
  });
};
