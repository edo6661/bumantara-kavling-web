import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  rolePermissionService,
  type UpsertRolePermissionDTO,
} from "../../services/rolePermission.service";

export const ROLE_PERMISSION_KEYS = {
  all: ["role-permissions"] as const,
};

export const useGetRolePermissions = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: [...ROLE_PERMISSION_KEYS.all, params],
    queryFn: () => rolePermissionService.getAll(params),
  });
};

export const useUpsertRolePermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertRolePermissionDTO) =>
      rolePermissionService.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLE_PERMISSION_KEYS.all });
    },
  });
};

export const useDeleteRolePermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rolePermissionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLE_PERMISSION_KEYS.all });
    },
  });
};
