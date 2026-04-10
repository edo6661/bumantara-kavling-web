import api from "../lib/axios";

export const customerKavlingService = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await api.get("/customer-kavling", { params });
    return response.data.data.items;
  },

  update: async (id: string | number, data: Record<string, unknown>) => {
    const response = await api.patch(`/customer-kavling/${id}`, data);
    return response.data.data;
  },
};
