import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  agentPencairanService,
  type AgentPencairanListParams,
} from '../../services/agentPencairan.service';
import { invalidateSidebarBadges } from './useSidebarBadges';

export const AGENT_PENCAIRAN_KEYS = {
  all: ['agent-pencairan'] as const,
  list: (params?: AgentPencairanListParams) =>
    [...AGENT_PENCAIRAN_KEYS.all, 'list', params] as const,
};

export const useGetAgentPencairanList = (params: AgentPencairanListParams) => {
  return useQuery({
    queryKey: AGENT_PENCAIRAN_KEYS.list(params),
    queryFn: () => agentPencairanService.getPaginated(params),
  });
};

export const useGetAllAgentPencairan = (
  params?: Omit<AgentPencairanListParams, 'page' | 'limit'>,
) => {
  return useQuery({
    queryKey: [...AGENT_PENCAIRAN_KEYS.all, 'all', params],
    queryFn: () => agentPencairanService.getAll(params),
    retry: false,
  });
};

export const useAjukanAgentPencairan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      feeAgentId,
      includeClosing,
      includeMarketing,
      fileInvoice,
    }: {
      feeAgentId: number;
      includeClosing: boolean;
      includeMarketing: boolean;
      fileInvoice?: File;
    }) =>
      agentPencairanService.ajukan(feeAgentId, {
        includeClosing,
        includeMarketing,
        fileInvoice,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_PENCAIRAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['fee-agents'] });
      invalidateSidebarBadges(queryClient);
    },
  });
};

export const useBayarAgentPencairan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      file,
      tanggalPembayaran,
    }: {
      id: number;
      file: File;
      tanggalPembayaran?: string;
    }) => agentPencairanService.bayar(id, file, tanggalPembayaran),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_PENCAIRAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['fee-agents'] });
      invalidateSidebarBadges(queryClient);
    },
  });
};

export const useSetAgentBsiCmsDilaporkan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, dilaporkan }: { ids: number[]; dilaporkan: boolean }) =>
      agentPencairanService.setBsiCmsDilaporkan(ids, dilaporkan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_PENCAIRAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['fee-agents'] });
    },
  });
};
