import api from '../lib/axios';
import type {
  BankKprPembayaranJenis,
  BankKprPembayaranStatus,
} from '../utils/bankKprPembayaran';

export interface BankKprPembayaranData {
  id: number;
  penjualanId: number;
  jenis: BankKprPembayaranJenis;
  nominal: number;
  status: BankKprPembayaranStatus;
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
    bank: string | null;
    bankKprNamaRekening: string | null;
    bankKprAtasNamaRekening: string | null;
    bankKprNoRekening: string | null;
    customer: { id: number; nama: string };
    kavling: {
      blok: string;
      nomorUnit: string;
      perumahan: { nama: string };
    };
  };
}

export interface BankKprPembayaranListParams {
  page?: number;
  limit?: number;
  status?: BankKprPembayaranStatus | 'ALL';
  search?: string;
}

export const bankKprPembayaranService = {
  getPaginated: async (params: BankKprPembayaranListParams = {}) => {
    const response = await api.get('/bank-kpr-pembayaran', { params });
    return response.data.data as {
      items: BankKprPembayaranData[];
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
    const response = await api.patch(`/bank-kpr-pembayaran/${id}/bayar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as BankKprPembayaranData;
  },

  setBsiCmsDilaporkan: async (ids: number[], dilaporkan: boolean) => {
    const response = await api.patch('/bank-kpr-pembayaran/bsi-cms-dilaporkan', {
      ids,
      dilaporkan,
    });
    return response.data.data as BankKprPembayaranData[];
  },

  /** Sementara: backfill data pembayaran dari penjualan KPR. */
  syncAll: async () => {
    const response = await api.post('/bank-kpr-pembayaran/sync');
    return response.data.message as string;
  },
};
