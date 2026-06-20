import api from "../lib/axios";
import type { SpkPembayaranData } from "./spkPembayaran.service";

export type SpkJenis = "RUMAH" | "INFRASTRUKTUR";

export interface SpkKavlingItem {
  id: number;
  kavlingId: number;
  blok: string;
  nomorUnit: string;
  luasTanah: number;
  luasBangunan: number;
  customerNama: string;
}

export interface SpkZonaSummary {
  id: number;
  nama: string;
  hgb: string;
  luas: string;
  deskripsi: string;
}

import type { PekerjaanInfraKategori } from "../constants/pekerjaanInfra";

export interface SpkPekerjaanInfraItem {
  id: number;
  pekerjaanInfraId: number;
  nama: string;
  kategori: PekerjaanInfraKategori;
  urutan: number;
}

export interface SpkData {
  id: number;
  noSpk: string;
  jenis: SpkJenis;
  tanggalSpk: string;
  judulPekerjaan: string;
  nilaiKontrak: number;
  bankRekeningPtId: number | null;
  zonaId: number | null;
  zona: SpkZonaSummary | null;
  nilaiSudahDibayarkan: number | null;
  sisaNilaiKontrak: number | null;
  progressOverride: number | null;
  progress: number;
  progressIsOverride: boolean;
  notesPekerjaan: string | null;
  jatuhTempo: string | null;
  fileSpk: string | null;
  mandorId: number;
  mandor: { id: number; username: string };
  kavlingItems: SpkKavlingItem[];
  pekerjaanInfraItems: SpkPekerjaanInfraItem[];
  pembayaranList?: SpkPembayaranData[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpkDTO {
  noSpk: string;
  jenis?: SpkJenis;
  tanggalSpk: string;
  judulPekerjaan: string;
  nilaiKontrak: number;
  bankRekeningPtId?: number | null;
  zonaId?: number | null;
  nilaiSudahDibayarkan?: number | null;
  sisaNilaiKontrak?: number | null;
  notesPekerjaan?: string;
  jatuhTempo?: string;
  mandorId: number;
  kavlingIds?: number[];
  pekerjaanInfraIds?: number[];
  fileSpk?: File | null;
  progressOverride?: number | null;
}

export interface UpdateSpkDTO extends Partial<CreateSpkDTO> {}

export interface SpkListSummary {
  totalSpk: number;
  totalKavling: number;
  totalNilaiKontrak: number;
  totalSudahDibayar: number;
  totalSisaNilai: number;
  progressSelesai: number;
}

export interface SpkPaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  summary?: SpkListSummary;
}

export interface SpkListResponse {
  items: SpkData[];
  meta: SpkPaginationMeta;
}

export interface GetSpkParams {
  page?: number;
  limit?: number;
  search?: string;
  jenis?: SpkJenis;
  orderBy?: "mandor:asc" | "mandor:desc" | "id:desc";
}

const buildFormData = (data: CreateSpkDTO | UpdateSpkDTO): FormData => {
  const formData = new FormData();
  if (data.noSpk !== undefined) formData.append("noSpk", data.noSpk);
  if (data.jenis !== undefined) formData.append("jenis", data.jenis);
  if (data.tanggalSpk !== undefined) formData.append("tanggalSpk", data.tanggalSpk);
  if (data.judulPekerjaan !== undefined) {
    formData.append("judulPekerjaan", data.judulPekerjaan);
  }
  if (data.nilaiKontrak !== undefined) {
    formData.append("nilaiKontrak", String(data.nilaiKontrak));
  }
  if (data.bankRekeningPtId !== undefined) {
    formData.append(
      "bankRekeningPtId",
      data.bankRekeningPtId == null ? "" : String(data.bankRekeningPtId),
    );
  }
  if (data.zonaId !== undefined) {
    formData.append("zonaId", data.zonaId == null ? "" : String(data.zonaId));
  }
  if (data.nilaiSudahDibayarkan !== undefined) {
    formData.append(
      "nilaiSudahDibayarkan",
      data.nilaiSudahDibayarkan == null ? "" : String(data.nilaiSudahDibayarkan),
    );
  }
  if (data.sisaNilaiKontrak !== undefined) {
    formData.append(
      "sisaNilaiKontrak",
      data.sisaNilaiKontrak == null ? "" : String(data.sisaNilaiKontrak),
    );
  }
  if (data.progressOverride !== undefined) {
    formData.append(
      "progressOverride",
      data.progressOverride == null ? "" : String(data.progressOverride),
    );
  }
  if (data.notesPekerjaan !== undefined) {
    formData.append("notesPekerjaan", data.notesPekerjaan);
  }
  if (data.jatuhTempo !== undefined) {
    formData.append("jatuhTempo", data.jatuhTempo);
  }
  if (data.mandorId !== undefined) {
    formData.append("mandorId", String(data.mandorId));
  }
  if (data.kavlingIds !== undefined) {
    formData.append("kavlingIds", JSON.stringify(data.kavlingIds));
  }
  if (data.pekerjaanInfraIds !== undefined) {
    formData.append("pekerjaanInfraIds", JSON.stringify(data.pekerjaanInfraIds));
  }
  if (data.fileSpk) {
    formData.append("fileSpk", data.fileSpk);
  }
  return formData;
};

export const spkService = {
  getPaginated: async (params?: GetSpkParams): Promise<SpkListResponse> => {
    const response = await api.get("/spk", { params });
    return response.data.data;
  },

  getAll: async (params?: { search?: string; limit?: number; jenis?: SpkJenis }): Promise<SpkData[]> => {
    const result = await spkService.getPaginated({
      page: 1,
      limit: params?.limit ?? 500,
      search: params?.search,
      jenis: params?.jenis,
    });
    return result.items;
  },

  getById: async (id: number): Promise<SpkData> => {
    const response = await api.get(`/spk/${id}`);
    return response.data.data;
  },

  create: async (data: CreateSpkDTO): Promise<SpkData> => {
    const response = await api.post("/spk", buildFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  update: async (id: number, data: UpdateSpkDTO): Promise<SpkData> => {
    const response = await api.patch(`/spk/${id}`, buildFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/spk/${id}`);
    return response.data;
  },
};
