import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  agentService,
  type CreateAgentDTO,
} from "../../services/agent.service";

export const AGENT_KEYS = {
  all: ["agents"] as const,
};

export const useGetAgents = () => {
  return useQuery({
    queryKey: AGENT_KEYS.all,
    queryFn: agentService.getAll,
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
