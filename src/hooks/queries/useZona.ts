import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  zonaService,
  type CreateZonaDTO,
  type UpdateZonaDTO,
} from "../../services/zona.service";

export const ZONA_KEYS = {
  all: ["zona"] as const,
  list: (search?: string) => [...ZONA_KEYS.all, "list", search] as const,
};

export const useGetZonaList = (search?: string) => {
  return useQuery({
    queryKey: ZONA_KEYS.list(search),
    queryFn: () => zonaService.getAll(search),
  });
};

export const useCreateZona = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateZonaDTO) => zonaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ZONA_KEYS.all });
    },
  });
};

export const useUpdateZona = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateZonaDTO }) =>
      zonaService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ZONA_KEYS.all });
    },
  });
};

export const useDeleteZona = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => zonaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ZONA_KEYS.all });
    },
  });
};
