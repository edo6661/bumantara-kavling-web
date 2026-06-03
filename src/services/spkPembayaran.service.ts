import api from '../lib/axios';
import type {
  SpkKasbonTargetTermin,
  SpkPembayaranJenis,
  SpkPembayaranStatus,
  SpkTerminPembayaranJenis,
} from '../utils/spkPembayaran';

export interface SpkPembayaranKasbonBarisData {
  id: number;
  spkPembayaranId: number;
  keterangan: string;
  tanggalPo: string;
  nominal: number;
}

export interface SpkPembayaranUpahBarisData {
  id: number;
  spkPembayaranId: number;
  tukangId: number | null;
  nik: string;
  nama: string;
  nominal: number;
}

export interface SpkPembayaranData {
  id: number;
  spkId: number;
  jenis: SpkPembayaranJenis;
  nominal: number;
  keterangan: string | null;
  tanggalPo: string | null;
  tanggalDari: string | null;
  tanggalSampai: string | null;
  mengurangiTermin: SpkKasbonTargetTermin | null;
  upahBaris?: SpkPembayaranUpahBarisData[];
  kasbonBaris?: SpkPembayaranKasbonBarisData[];
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

export interface SpkPembayaranUpahBarisBody {
  tukangId?: number | null;
  nik: string;
  nama: string;
  nominal: number;
}

export interface SpkPembayaranKasbonBarisBody {
  keterangan: string;
  tanggalPo: string;
  nominal: number;
}

export type CreateSpkPembayaranBody =
  | { jenis: SpkTerminPembayaranJenis }
  | { jenis: 'KASBON'; kasbonBaris: SpkPembayaranKasbonBarisBody[] }
  | { jenis: 'KASBON'; keterangan: string; nominal: number; tanggalPo: string }
  | {
      jenis: 'UPAH';
      tanggalDari: string;
      tanggalSampai: string;
      baris: SpkPembayaranUpahBarisBody[];
    };

export type UpdateSpkKasbonBody =
  | { kasbonBaris: SpkPembayaranKasbonBarisBody[] }
  | { keterangan: string; nominal: number; tanggalPo: string };

export interface UpdateSpkUpahBody {
  tanggalDari: string;
  tanggalSampai: string;
  baris: SpkPembayaranUpahBarisBody[];
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

  updateUpah: async (id: number, body: UpdateSpkUpahBody) => {
    const response = await api.patch(`/spk-pembayaran/${id}/upah`, body);
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

  addBukti: async (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('buktiPembayaran', file));
    const response = await api.patch(`/spk-pembayaran/${id}/bukti`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as SpkPembayaranData;
  },

  removeBukti: async (id: number, buktiUrl: string) => {
    const response = await api.delete(`/spk-pembayaran/${id}/bukti`, {
      data: { buktiUrl },
    });
    return response.data.data as SpkPembayaranData;
  },

  deletePengurangan: async (id: number) => {
    await api.delete(`/spk-pembayaran/${id}`);
  },

  setBsiCmsDilaporkan: async (ids: number[], dilaporkan: boolean) => {
    const response = await api.patch('/spk-pembayaran/bsi-cms-dilaporkan', {
      ids,
      dilaporkan,
    });
    return response.data.data as SpkPembayaranData[];
  },
};
