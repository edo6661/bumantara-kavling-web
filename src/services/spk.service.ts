import api from "../lib/axios";
import type { SpkPembayaranData } from "./spkPembayaran.service";

export interface SpkKavlingItem {
  id: number;
  kavlingId: number;
  blok: string;
  nomorUnit: string;
  customerNama: string;
}

export interface SpkData {
  id: number;
  noSpk: string;
  tanggalSpk: string;
  judulPekerjaan: string;
  nilaiKontrak: number;
  bankRekeningPtId: number | null;
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
  pembayaranList?: SpkPembayaranData[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpkDTO {
  noSpk: string;
  tanggalSpk: string;
  judulPekerjaan: string;
  nilaiKontrak: number;
  bankRekeningPtId?: number | null;
  nilaiSudahDibayarkan?: number | null;
  sisaNilaiKontrak?: number | null;
  notesPekerjaan?: string;
  jatuhTempo?: string;
  mandorId: number;
  kavlingIds: number[];
  fileSpk?: File | null;
  progressOverride?: number | null;
}

export interface UpdateSpkDTO extends Partial<CreateSpkDTO> {}

const buildFormData = (data: CreateSpkDTO | UpdateSpkDTO): FormData => {
  const formData = new FormData();
  if (data.noSpk !== undefined) formData.append("noSpk", data.noSpk);
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
  if (data.fileSpk) {
    formData.append("fileSpk", data.fileSpk);
  }
  return formData;
};

export const spkService = {
  getAll: async (params?: { search?: string; limit?: number }): Promise<SpkData[]> => {
    const response = await api.get("/spk", { params: { limit: 200, ...params } });
    return response.data.data.items;
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
