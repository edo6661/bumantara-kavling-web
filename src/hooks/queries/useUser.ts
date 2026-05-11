import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  userService,
  type CreateUserDTO,
  type UpdateUserDTO,
} from "../../services/user.service";

export const USER_KEYS = {
  all: ["users"] as const,
  list: (params: Record<string, unknown>) =>
    [...USER_KEYS.all, params] as const,
};

export const useGetUsers = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: USER_KEYS.list(params || {}),
    queryFn: () => userService.getAll(params),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserDTO) => userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserDTO }) =>
      userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
  });
};
