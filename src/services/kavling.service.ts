import api from "../lib/axios";

export interface KavlingData {
  id: string;
  perumahan: string;
  blok: string;
  nomorUnit: string;
  tipe: string;
  hargaJual: number;
  status: string;
}

export const kavlingService = {
  getAll: async () => {
    const response = await api.get<KavlingData[]>("/api/kavling");
    return response.data;
  },

  create: async (data: Omit<KavlingData, "id">) => {
    const response = await api.post<KavlingData>("/api/kavling", data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/api/kavling/${id}`);
    return response.data;
  },
};
