import api from '../lib/axios';
import type { SpkPembayaranJenis, SpkPembayaranStatus } from '../utils/spkPembayaran';

export interface SpkPembayaranData {
  id: number;
  spkId: number;
  jenis: SpkPembayaranJenis;
  nominal: number;
  status: SpkPembayaranStatus;
  buktiPembayaran: string | null;
  tanggalPembayaran: string | null;
  diajukanOlehId: number;
  dibayarOlehId: number | null;
  diajukanOleh: { id: number; username: string };
  dibayarOleh: { id: number; username: string } | null;
  createdAt: string;
  updatedAt: string;
  spk?: {
    id: number;
    noSpk: string;
    judulPekerjaan: string;
    nilaiKontrak: number;
    mandor: { id: number; username: string };
  };
}

export interface SpkPembayaranListParams {
  page?: number;
  limit?: number;
  status?: SpkPembayaranStatus | 'ALL';
  search?: string;
}

export const spkPembayaranService = {
  getBySpkId: async (spkId: number): Promise<SpkPembayaranData[]> => {
    const response = await api.get(`/spk-pembayaran/spk/${spkId}`);
    return response.data.data;
  },

  getPaginated: async (params: SpkPembayaranListParams = {}) => {
    const response = await api.get('/spk-pembayaran', { params });
    return response.data.data as {
      items: SpkPembayaranData[];
      meta: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    };
  },

  createRequest: async (spkId: number, jenis: SpkPembayaranJenis) => {
    const response = await api.post(`/spk-pembayaran/spk/${spkId}`, { jenis });
    return response.data.data as SpkPembayaranData;
  },

  bayar: async (id: number, file: File, tanggalPembayaran?: string) => {
    const formData = new FormData();
    formData.append('buktiPembayaran', file);
    if (tanggalPembayaran) {
      formData.append('tanggalPembayaran', tanggalPembayaran);
    }
    const response = await api.patch(`/spk-pembayaran/${id}/bayar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as SpkPembayaranData;
  },
};
