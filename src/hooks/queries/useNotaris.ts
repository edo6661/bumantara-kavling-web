import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  notarisService,
  type CreateNotarisDTO,
} from "../../services/notaris.service";

export const NOTARIS_KEYS = {
  all: ["notaris"] as const,
};

export const useGetNotaris = () => {
  return useQuery({
    queryKey: NOTARIS_KEYS.all,
    queryFn: notarisService.getAll,
  });
};

export const useCreateNotaris = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNotarisDTO) => notarisService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTARIS_KEYS.all });
    },
  });
};

export const useUpdateNotaris = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateNotarisDTO>;
    }) => notarisService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTARIS_KEYS.all });
    },
  });
};

export const useDeleteNotaris = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notarisService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTARIS_KEYS.all });
    },
  });
};
