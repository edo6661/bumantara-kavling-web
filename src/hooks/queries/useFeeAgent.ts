import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  feeAgentService,
  type UpdateFeeAgentDTO,
} from "../../services/feeAgent.service";

export const FEE_AGENT_KEYS = {
  all: ["fee-agents"] as const,
  lists: () => [...FEE_AGENT_KEYS.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...FEE_AGENT_KEYS.lists(), filters] as const,
};

export const useGetFeeAgents = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: FEE_AGENT_KEYS.list(params || {}),
    queryFn: () => feeAgentService.getAll(params),
  });
};

export const useUpdateFeeAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFeeAgentDTO }) =>
      feeAgentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEE_AGENT_KEYS.all });
    },
  });
};

export const useUploadBuktiFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      type,
      file,
    }: {
      id: number;
      type: "bookingBukti" | "closingBukti" | "marketingBukti";
      file: File;
    }) => feeAgentService.uploadBukti(id, type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEE_AGENT_KEYS.all });
    },
  });
};

export const useBackfillFeeAgents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => feeAgentService.backfill(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEE_AGENT_KEYS.all });
    },
  });
};
