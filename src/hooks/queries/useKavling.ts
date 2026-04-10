import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  kavlingService,
  type CreateKavlingDTO,
} from "../../services/kavling.service";

export const KAVLING_KEYS = {
  all: ["kavlings"] as const,
  byPerumahan: (perumahanId: number) => ["kavlings", { perumahanId }] as const,
};

export const useGetKavlings = (perumahanId?: number) => {
  return useQuery({
    queryKey: perumahanId
      ? KAVLING_KEYS.byPerumahan(perumahanId)
      : KAVLING_KEYS.all,
    queryFn: () => kavlingService.getAll(perumahanId),
  });
};

export const useCreateKavling = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newData: CreateKavlingDTO) => kavlingService.create(newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KAVLING_KEYS.all });
    },
  });
};

export const useUpdateKavling = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateKavlingDTO>;
    }) => kavlingService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KAVLING_KEYS.all });
    },
  });
};

export const useDeleteKavling = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => kavlingService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KAVLING_KEYS.all });
    },
  });
};
