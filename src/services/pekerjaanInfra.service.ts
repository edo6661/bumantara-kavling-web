import api from "../lib/axios";
import type { PekerjaanInfraKategori } from "../constants/pekerjaanInfra";

export interface PekerjaanInfraData {
  id: number;
  nama: string;
  kategori: PekerjaanInfraKategori;
  urutan: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePekerjaanInfraDTO {
  nama: string;
  kategori?: PekerjaanInfraKategori;
  urutan?: number;
}

export interface UpdatePekerjaanInfraDTO {
  nama?: string;
  kategori?: PekerjaanInfraKategori;
  urutan?: number;
  isActive?: boolean;
}

export const pekerjaanInfraService = {
  getAll: async (): Promise<PekerjaanInfraData[]> => {
    const response = await api.get("/pekerjaan-infra");
    return response.data.data;
  },

  create: async (data: CreatePekerjaanInfraDTO): Promise<PekerjaanInfraData> => {
    const response = await api.post("/pekerjaan-infra", data);
    return response.data.data;
  },

  update: async (id: number, data: UpdatePekerjaanInfraDTO): Promise<PekerjaanInfraData> => {
    const response = await api.patch(`/pekerjaan-infra/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/pekerjaan-infra/${id}`);
    return response.data;
  },
};
