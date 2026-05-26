import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../../services/auth.service";
import type { MandorProfile } from "../../types/models/user";

export const PROFILE_KEYS = {
  me: ["auth-profile"] as const,
};

export interface UpdateSelfPayload {
  username?: string;
  email?: string;
  password?: string;
  mandor?: MandorProfile;
}

export const useGetProfile = () => {
  return useQuery({
    queryKey: PROFILE_KEYS.me,
    queryFn: () => authService.getProfile(),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSelfPayload) => authService.updateSelf(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.me });
    },
  });
};
