import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  pekerjaanInfraService,
  type CreatePekerjaanInfraDTO,
  type UpdatePekerjaanInfraDTO,
} from "../../services/pekerjaanInfra.service";

export const PEKERJAAN_INFRA_KEYS = {
  all: ["pekerjaan-infra"] as const,
};

export const useGetPekerjaanInfraList = () => {
  return useQuery({
    queryKey: PEKERJAAN_INFRA_KEYS.all,
    queryFn: () => pekerjaanInfraService.getAll(),
  });
};

export const useCreatePekerjaanInfra = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePekerjaanInfraDTO) => pekerjaanInfraService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEKERJAAN_INFRA_KEYS.all });
    },
  });
};

export const useUpdatePekerjaanInfra = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePekerjaanInfraDTO }) =>
      pekerjaanInfraService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEKERJAAN_INFRA_KEYS.all });
    },
  });
};

export const useDeletePekerjaanInfra = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => pekerjaanInfraService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEKERJAAN_INFRA_KEYS.all });
    },
  });
};
