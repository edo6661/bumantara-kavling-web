import api from "../lib/axios";

export interface PicAgentData {
  id?: number;
  nama: string;
  noHp: string;
  alamat?: string;
}

export interface PenjualanAgentData {
  id: number;
  noTransaksi: string;
  tanggal: string;
  hargaJual: number;
  status: string;
  customer?: { nama: string };
  kavling?: {
    blok: string;
    nomorUnit: string;
    perumahan?: { nama: string };
  };
}

export interface AgentData {
  id: number;
  nik: string;
  kodeSales: string | null;
  nama: string;
  alamat: string | null;
  noHp: string;
  email: string | null;
  status: string;
  pics: PicAgentData[];
  penjualan?: PenjualanAgentData[];
}

export interface CreateAgentDTO {
  nik: string;
  nama: string;
  alamat?: string;
  noHp: string;
  email?: string;
  status?: string;
  pics?: PicAgentData[];
}

export const agentService = {
  getAll: async (): Promise<AgentData[]> => {
    const response = await api.get("/agents?limit=100");
    return response.data.data.items;
  },

  create: async (data: CreateAgentDTO) => {
    const response = await api.post("/agents", data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreateAgentDTO>) => {
    const response = await api.patch(`/agents/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/agents/${id}`);
    return response.data;
  },
};
