import api from "../lib/axios";

export interface ZonaData {
  id: number;
  nama: string;
  hgb: string;
  luas: string;
  deskripsi: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateZonaDTO {
  nama: string;
  hgb: string;
  luas: string;
  deskripsi: string;
}

export interface UpdateZonaDTO extends Partial<CreateZonaDTO> {}

export const zonaService = {
  getAll: async (search?: string): Promise<ZonaData[]> => {
    const response = await api.get("/zona", { params: search ? { search } : undefined });
    return response.data.data;
  },

  getById: async (id: number): Promise<ZonaData> => {
    const response = await api.get(`/zona/${id}`);
    return response.data.data;
  },

  create: async (data: CreateZonaDTO): Promise<ZonaData> => {
    const response = await api.post("/zona", data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateZonaDTO): Promise<ZonaData> => {
    const response = await api.patch(`/zona/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/zona/${id}`);
    return response.data;
  },
};
