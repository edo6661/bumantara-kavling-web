import api from "../lib/axios";

export interface TagihanData {
  id: number;
  noTagihan: string;
  customerId: number;
  namaCustomer: string;
  penjualanId: number;
  perumahan: string;
  blok: string;
  nomorUnit: string;
  pembayaran: string;
  nominal: number;
  jatuhTempo: string;
  status: string;
  fileBukti: string | null;
  reminderBerikutnya: string | null;
  rekeningTujuan?: {
    namaBank: string;
    noRekening: string;
    atasNama: string;
  } | null;
  isRefunded?: boolean;
  fileBuktiRefund?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTagihanDTO {
  customerId: number;
  penjualanId: number;
  pembayaran: string;
  nominal: number;
  jatuhTempo: string;
  reminderBerikutnya?: string | null;
}

export interface UpdateTagihanDTO {
  pembayaran?: string;
  nominal?: number;
  jatuhTempo?: string;
  status?: string;
  reminderBerikutnya?: string | null;
}

export const tagihanService = {
  getAll: async (params?: Record<string, unknown>): Promise<TagihanData[]> => {
    // Menggunakan limit besar untuk sementara agar semua data terambil
    const response = await api.get("/tagihan", {
      params: { limit: 100, ...params },
    });
    return response.data.data.items;
  },

  getById: async (id: number): Promise<TagihanData> => {
    const response = await api.get(`/tagihan/${id}`);
    return response.data.data;
  },

  create: async (data: CreateTagihanDTO) => {
    const response = await api.post("/tagihan", data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateTagihanDTO) => {
    const response = await api.patch(`/tagihan/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/tagihan/${id}`);
    return response.data;
  },

  uploadBukti: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append("fileBukti", file);
    const response = await api.patch(`/tagihan/${id}/upload-bukti`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },
  uploadRefund: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append("fileBuktiRefund", file);
    const response = await api.patch(`/tagihan/${id}/refund`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },
};
