import api from "../lib/axios";

export interface CustomerKavlingPaginatedResponse {
  items: Record<string, unknown>[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const customerKavlingService = {
  getPaginated: async (
    params?: Record<string, unknown>,
  ): Promise<CustomerKavlingPaginatedResponse> => {
    const response = await api.get("/customer-kavling", { params });
    return response.data.data;
  },

  /** Semua kavling customer untuk dropdown/lookup (tanpa pagination UI). */
  getAll: async (params?: Record<string, unknown>) => {
    const response = await customerKavlingService.getPaginated({
      limit: 500,
      page: 1,
      ...params,
    });
    return response.items;
  },

  update: async (id: string | number, data: Record<string, unknown>) => {
    const response = await api.patch(`/customer-kavling/${id}`, data);
    return response.data.data;
  },
};
