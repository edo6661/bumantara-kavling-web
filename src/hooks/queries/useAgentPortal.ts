import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  agentPortalService,
  type UpdateAgentProfilePayload,
} from "../../services/agentPortal.service";
import { authService } from "../../services/auth.service";

export const AGENT_PORTAL_KEYS = {
  profile: ["agent-portal-profile"] as const,
};

export const useGetMyAgentProfile = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: AGENT_PORTAL_KEYS.profile,
    queryFn: agentPortalService.getProfile,
    enabled: options?.enabled ?? true,
  });
};

export const useUploadMyAgentDoc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ docType, file }: { docType: string; file: File }) =>
      agentPortalService.uploadDocument(docType, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_PORTAL_KEYS.profile });
    },
  });
};

export const useUpdateMyAgentAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email?: string; password?: string }) =>
      authService.updateSelf(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_PORTAL_KEYS.profile });
    },
  });
};

export const useUpdateMyAgentProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAgentProfilePayload) =>
      agentPortalService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_PORTAL_KEYS.profile });
    },
  });
};
