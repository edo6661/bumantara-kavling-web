import api from '../lib/axios';

export type AgentPencairanStatus = 'MENUNGGU_PEMBAYARAN' | 'SUDAH_DIBAYAR';
export type AgentPencairanTahap = 'PPJB' | 'AJB';

export interface AgentPencairanData {
  id: number;
  feeAgentId: number;
  penjualanId: number;
  agentId: number;
  tahap: AgentPencairanTahap;
  closingNominal: number;
  marketingNominal: number;
  potonganPph: number;
  totalNominal: number;
  status: AgentPencairanStatus;
  fileInvoice: string | null;
  fileInvoiceList: string[];
  buktiPembayaran: string | null;
  tanggalPembayaran: string | null;
  bsiCmsDilaporkan: boolean;
  bsiCmsDilaporkanAt: string | null;
  diajukanOlehId: number;
  dibayarOlehId: number | null;
  createdAt: string;
  updatedAt: string;
  diajukanOleh?: { id: number; username: string };
  dibayarOleh?: { id: number; username: string } | null;
  agent?: {
    id: number;
    nama: string;
    namaBank: string | null;
    noRekening: string | null;
    atasNamaRekening: string | null;
  };
  penjualan?: {
    id: number;
    noTransaksi: string;
    customer: { id: number; nama: string };
    kavling: {
      blok: string;
      nomorUnit: string;
      perumahan: { nama: string };
      rekeningTujuan: {
        id: number;
        namaBank: string;
        noRekening: string;
        atasNama: string;
      } | null;
    };
  };
}

export interface AgentPencairanListParams {
  page?: number;
  limit?: number;
  status?: AgentPencairanStatus | 'ALL';
  search?: string;
  agentId?: number;
  feeAgentId?: number;
}

export const agentPencairanService = {
  getPaginated: async (params: AgentPencairanListParams = {}) => {
    const response = await api.get('/agent-pencairan', { params });
    return response.data.data as {
      items: AgentPencairanData[];
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

  getAll: async (params?: Omit<AgentPencairanListParams, 'page' | 'limit'>) => {
    const limit = 200;
    const all: AgentPencairanData[] = [];
    let page = 1;

    for (;;) {
      const response = await agentPencairanService.getPaginated({
        ...params,
        page,
        limit,
      });
      all.push(...response.items);
      if (!response.meta.hasNextPage) break;
      page += 1;
    }

    return all;
  },

  ajukan: async (
    feeAgentId: number,
    options: {
      includeClosing: boolean;
      includeMarketing: boolean;
      fileInvoices?: File[];
    },
  ) => {
    const formData = new FormData();
    formData.append('feeAgentId', String(feeAgentId));
    formData.append('includeClosing', String(options.includeClosing));
    formData.append('includeMarketing', String(options.includeMarketing));
    options.fileInvoices?.forEach((file) => {
      formData.append('fileInvoice', file);
    });
    const response = await api.post('/agent-pencairan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as AgentPencairanData;
  },

  bayar: async (id: number, file: File, tanggalPembayaran?: string) => {
    const formData = new FormData();
    formData.append('buktiPembayaran', file);
    if (tanggalPembayaran) {
      formData.append('tanggalPembayaran', tanggalPembayaran);
    }
    const response = await api.patch(`/agent-pencairan/${id}/bayar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as AgentPencairanData;
  },

  setBsiCmsDilaporkan: async (ids: number[], dilaporkan: boolean) => {
    const response = await api.patch('/agent-pencairan/bsi-cms-dilaporkan', {
      ids,
      dilaporkan,
    });
    return response.data.data as AgentPencairanData[];
  },
};
