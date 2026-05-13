import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  perusahaanAgentService,
  type CreatePerusahaanAgentDTO,
} from "../../services/perusahaanAgent.service";

export const PERUSAHAAN_AGENT_KEYS = {
  all: ["perusahaan-agents"] as const,
};

export const useGetPerusahaanAgents = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: [...PERUSAHAAN_AGENT_KEYS.all, params],
    queryFn: () => perusahaanAgentService.getAll(params),
  });
};

export const useCreatePerusahaanAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePerusahaanAgentDTO) =>
      perusahaanAgentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERUSAHAAN_AGENT_KEYS.all });
    },
  });
};

export const useUpdatePerusahaanAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreatePerusahaanAgentDTO>;
    }) => perusahaanAgentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERUSAHAAN_AGENT_KEYS.all });
    },
  });
};

export const useDeletePerusahaanAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => perusahaanAgentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERUSAHAAN_AGENT_KEYS.all });
    },
  });
};

export const useUploadAktePerusahaan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      perusahaanAgentService.uploadAkte(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERUSAHAAN_AGENT_KEYS.all });
    },
  });
};
