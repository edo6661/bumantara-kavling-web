import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  customerService,
  type CreateCustomerDTO,
  type CustomerDocType,
} from "../../services/customer.service";
import api from "../../lib/axios";

export const CUSTOMER_KEYS = {
  all: ["customers"] as const,
  list: ["customers", "list"] as const,
  paginated: (params: Record<string, unknown>) =>
    ["customers", "paginated", params] as const,
};

/** Daftar customer lengkap (max 300) — untuk lookup/dropdown, tanpa pagination. */
export const useGetCustomers = () => {
  return useQuery({
    queryKey: CUSTOMER_KEYS.list,
    queryFn: customerService.getAll,
  });
};

/** Daftar customer dengan pagination, search, dan sort (halaman Administrasi). */
export const useGetCustomersPaginated = (params: Record<string, unknown>) => {
  return useQuery({
    queryKey: CUSTOMER_KEYS.paginated(params),
    queryFn: () => customerService.getPaginated(params),
  });
};
export const useGetCustomerById = (id: string) => {
  return useQuery({
    queryKey: [...CUSTOMER_KEYS.all, "detail", id],
    queryFn: async () => {
      const res = await api.get(`/customers/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomerDTO) => customerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateCustomerDTO>;
    }) => customerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => customerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
    },
  });
};
export const useUploadCustomerDoc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      docType,
      file,
      namaDokumen,
      pdfPassword,
    }: {
      id: number;
      docType: CustomerDocType;
      file: File;
      namaDokumen?: string;
      pdfPassword?: string;
    }) =>
      customerService.uploadDoc(id, docType, file, namaDokumen, pdfPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
    },
  });
};

export const useGenerateCustomerAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const response = await api.post(`/customers/${id}/generate-account`, {
        password,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
    },
  });
};
