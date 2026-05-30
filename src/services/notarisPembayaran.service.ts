import api from '../lib/axios';
import type {
  NotarisPembayaranJenis,
  NotarisPembayaranStatus,
} from '../utils/notarisPembayaran';

export interface NotarisPembayaranData {
  id: number;
  penjualanId: number;
  jenis: NotarisPembayaranJenis;
  nominal: number;
  status: NotarisPembayaranStatus;
  buktiPembayaran: string | null;
  tanggalPembayaran: string | null;
  bsiCmsDilaporkan: boolean;
  bsiCmsDilaporkanAt: string | null;
  dibayarOlehId: number | null;
  dibayarOleh: { id: number; username: string } | null;
  createdAt: string;
  updatedAt: string;
  penjualan?: {
    id: number;
    noTransaksi: string;
    customer: { id: number; nama: string };
    kavling: {
      blok: string;
      nomorUnit: string;
      perumahan: { nama: string };
    };
    detailKavlingPajak: {
      notaris: {
        id: number;
        nama: string;
        namaBank: string | null;
        noRekening: string | null;
        atasNamaRekening: string | null;
      } | null;
    } | null;
  };
}

export interface NotarisPembayaranListParams {
  page?: number;
  limit?: number;
  status?: NotarisPembayaranStatus | 'ALL';
  search?: string;
}

export const notarisPembayaranService = {
  getPaginated: async (params: NotarisPembayaranListParams = {}) => {
    const response = await api.get('/notaris-pembayaran', { params });
    return response.data.data as {
      items: NotarisPembayaranData[];
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

  bayar: async (id: number, file: File, tanggalPembayaran?: string) => {
    const formData = new FormData();
    formData.append('buktiPembayaran', file);
    if (tanggalPembayaran) {
      formData.append('tanggalPembayaran', tanggalPembayaran);
    }
    const response = await api.patch(`/notaris-pembayaran/${id}/bayar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as NotarisPembayaranData;
  },

  setBsiCmsDilaporkan: async (ids: number[], dilaporkan: boolean) => {
    const response = await api.patch('/notaris-pembayaran/bsi-cms-dilaporkan', {
      ids,
      dilaporkan,
    });
    return response.data.data as NotarisPembayaranData[];
  },
};
