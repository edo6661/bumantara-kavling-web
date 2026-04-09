import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";

export const useCrud = <T>(endpoint: string, queryKeyName: string) => {
  const queryClient = useQueryClient();

  const keys = {
    all: [queryKeyName] as const,
    detail: (id: string) => [queryKeyName, id] as const,
  };

  const getAll = useQuery({
    queryKey: keys.all,
    queryFn: async () => {
      const { data } = await api.get<T[]>(endpoint);
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (newData: Omit<T, "id">) => {
      const { data } = await api.post<T>(endpoint, newData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<T> & { id: string }) => {
      const { data } = await api.put<T>(`${endpoint}/${id}`, updateData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`${endpoint}/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });

  return { keys, getAll, create, update, remove };
};
