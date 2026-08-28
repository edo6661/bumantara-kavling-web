import api from "../lib/axios";
import type { SpkPembayaranData } from "./spkPembayaran.service";
import type {
  SpkCustomTerminStep,
  SpkTerminSchemeKey,
} from "../utils/spkTerminScheme";

export type { SpkCustomTerminStep, SpkTerminSchemeKey };

export type SpkJenis = "RUMAH" | "INFRASTRUKTUR";

export type SpkApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

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
  terminScheme: SpkTerminSchemeKey;
  terminConfig?: SpkCustomTerminStep[] | null;
  tanggalSpk: string;
  judulPekerjaan: string;
  nilaiKontrak: number;
  bankRekeningPtId: number | null;
  bankRekeningPt?: {
    id: number;
    namaBank: string;
    atasNama: string;
  } | null;
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
  /** Di prod lama / sebelum migration, field ini bisa belum ada */
  fileRab?: string | null;
  mandorId: number;
  mandor: { id: number; username: string };
  /** Di prod lama / sebelum migration, field ini bisa belum ada — anggap APPROVED */
  statusApproval?: SpkApprovalStatus;
  diajukanOlehId: number | null;
  disetujuiOlehId: number | null;
  tanggalDisetujui: string | null;
  catatanPenolakan: string | null;
  diajukanOleh: { id: number; username: string } | null;
  disetujuiOleh: { id: number; username: string } | null;
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
  terminScheme?: SpkTerminSchemeKey;
  terminConfig?: SpkCustomTerminStep[] | string | null;
  fileSpk?: File | null;
  fileRab?: File | null;
  progressOverride?: number | null;
}

export type UpdateSpkDTO = Partial<CreateSpkDTO>;

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
  statusApproval?: SpkApprovalStatus;
  orderBy?: "mandor:asc" | "mandor:desc" | "id:desc";
}

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

const buildFormData = (data: CreateSpkDTO | UpdateSpkDTO): FormData => {
  const formData = new FormData();
  if (data.noSpk !== undefined) formData.append("noSpk", data.noSpk);
  if (data.jenis !== undefined) formData.append("jenis", data.jenis);
  if (data.terminScheme !== undefined) formData.append("terminScheme", data.terminScheme);
  if (data.terminConfig !== undefined) {
    formData.append(
      "terminConfig",
      typeof data.terminConfig === "string"
        ? data.terminConfig
        : JSON.stringify(data.terminConfig ?? []),
    );
  }
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
  if (data.fileRab) {
    formData.append("fileRab", data.fileRab);
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

  exportExcel: async (): Promise<void> => {
    const response = await api.get("/spk/export/excel", {
      responseType: "blob",
    });
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const fallback = `Rekap_SPK_Disetujui_${new Date().toISOString().slice(0, 10)}.xlsx`;
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

  approve: async (id: number): Promise<SpkData> => {
    const response = await api.post(`/spk/${id}/approve`);
    return response.data.data;
  },

  reject: async (id: number, catatanPenolakan?: string): Promise<SpkData> => {
    const response = await api.post(`/spk/${id}/reject`, {
      catatanPenolakan: catatanPenolakan || undefined,
    });
    return response.data.data;
  },
};
