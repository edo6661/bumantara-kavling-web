import api from "../lib/axios";

export interface KavlingData {
  id: number;
  perumahanId: number;
  perumahan?: { id: number; nama: string };
  blok: string;
  nomorUnit: string;
  namaTipe: string;
  luasBangunan: number;
  luasTanah: number;
  hargaJual: number;
  status: string;
  rekeningTujuanId: number | null;
  rekeningTujuan?: {
    namaBank: string;
    noRekening: string;
    atasNama: string;
  } | null;
  filePbg: string | null;
  fileSertifikatTanah: string | null;
  fileNopPbb: string | null;
  // Tambahkan relasi penjualan untuk membaca data pembeli
  penjualan?: {
    customer?: {
      nama: string;
      noHp: string;
    };
  }[];
}

export interface CreateKavlingDTO {
  perumahanId: number;
  blok: string;
  nomorUnit: string;
  namaTipe: string;
  luasBangunan: number;
  luasTanah: number;
  hargaJual: number;
  status?: string;
  rekeningTujuanId?: number;
  filePbg?: string;
  fileSertifikatTanah?: string;
  fileNopPbb?: string;
}
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface KavlingResponse {
  items: KavlingData[];
  meta: PaginationMeta;
}

export interface GetKavlingParams {
  page?: number;
  limit?: number;
  search?: string;
  perumahanId?: number;
  status?: string;
}
export const kavlingService = {
  getAll: async (params?: GetKavlingParams): Promise<KavlingResponse> => {
    const response = await api.get("/kavling", {
      params: { limit: 10, page: 1, ...params },
    });
    return response.data.data;
  },

  create: async (data: CreateKavlingDTO) => {
    const response = await api.post("/kavling", data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreateKavlingDTO>) => {
    const response = await api.patch(`/kavling/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/kavling/${id}`);
    return response.data;
  },
};
