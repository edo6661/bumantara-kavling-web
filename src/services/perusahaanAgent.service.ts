import api from "../lib/axios";

export interface PerusahaanAgentData {
  id: number;
  nama: string;
  npwp?: string | null;
  namaBank?: string | null;
  noRekening?: string | null;
  atasNamaRekening?: string | null;
  feeMarketingPct?: number | null;
  feeClosingNominal?: number | null;
  potonganPph?: number | null;
  akte: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePerusahaanAgentDTO {
  nama: string;
  npwp?: string;
  namaBank?: string;
  noRekening?: string;
  atasNamaRekening?: string;
  feeMarketingPct?: number;
  feeClosingNominal?: number;
  potonganPph?: number;
}

export const perusahaanAgentService = {
  getAll: async (
    params?: Record<string, unknown>,
  ): Promise<PerusahaanAgentData[]> => {
    const response = await api.get("/perusahaan-agents", {
      params: { limit: 100, ...params },
    });
    return response.data.data.items;
  },

  create: async (data: CreatePerusahaanAgentDTO) => {
    const response = await api.post("/perusahaan-agents", data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreatePerusahaanAgentDTO>) => {
    const response = await api.patch(`/perusahaan-agents/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/perusahaan-agents/${id}`);
    return response.data;
  },

  uploadAkte: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.patch(
      `/perusahaan-agents/${id}/upload-akte`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  },
};
