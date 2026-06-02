import api from '../lib/axios';
import type {
  SpkKasbonTargetTermin,
  SpkPembayaranJenis,
  SpkPembayaranStatus,
  SpkTerminPembayaranJenis,
} from '../utils/spkPembayaran';

export interface SpkPembayaranData {
  id: number;
  spkId: number;
  jenis: SpkPembayaranJenis;
  nominal: number;
  keterangan: string | null;
  tanggalPo: string | null;
  mengurangiTermin: SpkKasbonTargetTermin | null;
  status: SpkPembayaranStatus;
  buktiPembayaran: string | null;
  buktiPembayaranList?: string[] | null;
  tanggalPembayaran: string | null;
  bsiCmsDilaporkan: boolean;
  bsiCmsDilaporkanAt: string | null;
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
    bankRekeningPt: {
      id: number;
      namaBank: string;
      noRekening: string;
      atasNama: string;
    } | null;
    mandor: {
      id: number;
      username: string;
      namaBank: string;
      noRekening: string;
      atasNamaRekening: string;
    };
  };
}

export interface SpkPembayaranListParams {
  page?: number;
  limit?: number;
  status?: SpkPembayaranStatus | 'ALL';
  search?: string;
}

export type CreateSpkPembayaranBody =
  | { jenis: SpkTerminPembayaranJenis }
  | { jenis: 'KASBON'; keterangan: string; nominal: number; tanggalPo: string };

export interface UpdateSpkKasbonBody {
  keterangan: string;
  nominal: number;
  tanggalPo: string;
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

  createRequest: async (spkId: number, body: CreateSpkPembayaranBody) => {
    const response = await api.post(`/spk-pembayaran/spk/${spkId}`, body);
    return response.data.data as SpkPembayaranData;
  },

  updateKasbon: async (id: number, body: UpdateSpkKasbonBody) => {
    const response = await api.patch(`/spk-pembayaran/${id}/kasbon`, body);
    return response.data.data as SpkPembayaranData;
  },

  bayar: async (id: number, files: File[], tanggalPembayaran?: string) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('buktiPembayaran', file));
    if (tanggalPembayaran) {
      formData.append('tanggalPembayaran', tanggalPembayaran);
    }
    const response = await api.patch(`/spk-pembayaran/${id}/bayar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as SpkPembayaranData;
  },

  setBsiCmsDilaporkan: async (ids: number[], dilaporkan: boolean) => {
    const response = await api.patch('/spk-pembayaran/bsi-cms-dilaporkan', {
      ids,
      dilaporkan,
    });
    return response.data.data as SpkPembayaranData[];
  },
};
