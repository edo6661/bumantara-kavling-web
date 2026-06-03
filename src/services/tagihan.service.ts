import api from "../lib/axios";
import type { TagihanTujuan } from "../constants/tagihanTujuan";
import { appendFilesToFormData } from "../utils/tagihanBukti";

export interface TagihanData {
  id: number;
  noTagihan: string;
  customerId: number;
  namaCustomer: string;
  penjualanId: number;
  perumahan: string;
  blok: string;
  nomorUnit: string;
  tujuan?: TagihanTujuan;
  pembayaran: string;
  nominal: number;
  jatuhTempo: string;
  status: string;
  fileBukti: string | null;
  fileBuktiList?: string[];
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
  tujuan?: TagihanTujuan;
  nominal: number;
  jatuhTempo: string;
  reminderBerikutnya?: string | null;
}

export interface UpdateTagihanDTO {
  pembayaran?: string;
  tujuan?: TagihanTujuan;
  nominal?: number;
  jatuhTempo?: string;
  status?: string;
  reminderBerikutnya?: string | null;
}
export interface TagihanResponse {
  items: TagihanData[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const tagihanService = {
  getAll: async (
    params?: Record<string, unknown>,
  ): Promise<TagihanResponse> => {
    const response = await api.get("/tagihan", {
      // Ubah default limit menjadi 10 dan page 1
      params: { limit: 10, page: 1, ...params },
    });
    // Hapus .items di ujungnya agar mengembalikan objek lengkap
    return response.data.data;
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

  uploadBukti: async (id: number, files: File | File[]) => {
    const formData = new FormData();
    appendFilesToFormData(formData, "fileBukti", files);
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
  uploadSignature: async (data: {
    noTagihanId: number;
    signatureBase64: string;
    nama: string;
    peran: string;
    tanggal: string;
  }) => {
    const response = await api.post(`/tagihan/${data.noTagihanId}/signature`, {
      signatureBase64: data.signatureBase64,
      nama: data.nama,
      peran: data.peran,
      tanggal: data.tanggal,
    });
    return response.data.data;
  },
  approveBukti: async (id: number, isApproved: boolean) => {
    const response = await api.post(`/tagihan/${id}/approve`, { isApproved });
    return response.data.data;
  },
};
