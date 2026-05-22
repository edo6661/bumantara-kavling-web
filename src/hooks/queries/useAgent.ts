import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agentService } from "../../services/agent.service";
import type { CreateAgentDTO } from "../../types/models/agent";

export const AGENT_KEYS = {
  all: ["agents"] as const,
  list: ["agents", "list"] as const,
  paginated: (params: Record<string, unknown>) =>
    ["agents", "paginated", params] as const,
};

/** Daftar agent lengkap (max 300) — untuk lookup/dropdown, tanpa pagination. */
export const useGetAgents = () => {
  return useQuery({
    queryKey: AGENT_KEYS.list,
    queryFn: agentService.getAll,
  });
};

/** Daftar agent dengan pagination, search, sort, dan filter (halaman Marketing Agents). */
export const useGetAgentsPaginated = (params: Record<string, unknown>) => {
  return useQuery({
    queryKey: AGENT_KEYS.paginated(params),
    queryFn: () => agentService.getPaginated(params),
  });
};

export const useCreateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAgentDTO) => agentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.all });
    },
  });
};

export const useUpdateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateAgentDTO> }) =>
      agentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.all });
    },
  });
};

export const useDeleteAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => agentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.all });
    },
  });
};

export const useUploadAgentDoc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      docType,
      file,
    }: {
      id: number;
      docType: string;
      file: File;
    }) => agentService.uploadDoc(id, docType, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.all });
    },
  });
};

export const useGenerateAgentAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      agentService.generateAccount(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.all });
    },
  });
};
