import api from "../lib/axios";

export type JenisKavling = 'PERUMAHAN' | 'RUKO';

export interface KavlingData {
  id: number;
  perumahanId: number;
  perumahan?: { id: number; nama: string };
  jenisKavling: JenisKavling;
  blok: string;
  nomorUnit: string;
  namaTipe: string;
  luasBangunan: number;
  luasTanah: number;
  hargaDasar: number;
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
  nopd: string | null;
  jumlahSertifikatTanah?: number;
  sertifikatTanahTambahan?: {
    id: number;
    kavlingId: number;
    urutan: number;
    filePbg: string | null;
    fileSertifikatTanah: string | null;
    fileNopPbb: string | null;
    nopd: string | null;
  }[];
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
  hargaDasar: number;
  jenisKavling?: JenisKavling;
  status?: string;
  rekeningTujuanId?: number;
  jumlahSertifikatTanah?: number;

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
  summary?: Record<string, number>;
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
  jenisKavling?: JenisKavling;
  orderBy?: string;
}

export type ExportKavlingParams = Omit<GetKavlingParams, "page" | "limit">;

function parseFilenameFromDisposition(
  disposition: string | undefined,
  fallback: string,
): string {
  if (!disposition) return fallback;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
  }
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1]?.trim() || fallback;
}

export const JENIS_KAVLING_LABELS: Record<JenisKavling, string> = {
  PERUMAHAN: 'Perumahan',
  RUKO: 'Ruko',
};

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

  uploadDocument: async (id: number, docType: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.patch(
      `/kavling/${id}/upload/${docType}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },

  exportExcel: async (params?: ExportKavlingParams): Promise<void> => {
    const response = await api.get("/kavling/export/excel", {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const fallback = `Data_Kavling_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const filename = parseFilenameFromDisposition(
      response.headers["content-disposition"] as string | undefined,
      fallback,
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },

  exportPengeluaranExcel: async (params?: ExportKavlingParams): Promise<void> => {
    const response = await api.get("/kavling/export/pengeluaran/excel", {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const fallback = `Pengeluaran_Kavling_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const filename = parseFilenameFromDisposition(
      response.headers["content-disposition"] as string | undefined,
      fallback,
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },

  uploadSertifikatTambahanDocument: async (
    id: number,
    urutan: number,
    docType: string,
    file: File,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.patch(
      `/kavling/${id}/upload-tambahan/${urutan}/${docType}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },

  deleteDocument: async (id: number, docType: string) => {
    const response = await api.delete(`/kavling/${id}/upload/${docType}`);
    return response.data.data;
  },

  deleteSertifikatTambahanDocument: async (
    id: number,
    urutan: number,
    docType: string,
  ) => {
    const response = await api.delete(
      `/kavling/${id}/upload-tambahan/${urutan}/${docType}`,
    );
    return response.data.data;
  },
};
