import api from "../lib/axios";

export interface MandorOption {
  id: number;
  username: string;
}

export interface TahapanProyekData {
  id?: number;
  namaTahapan: string;
  persentase: number;
  deskripsi: string | null;
  tanggal: string;
  foto: string[];
  reportedBy?: MandorOption | null;
}

export interface ProgressProyekData {
  id: number;
  penjualanId: number;
  mandorId: number | null;
  mandor: MandorOption | null;
  persentase: number;
  createdAt: string;
  updatedAt: string;
  tahapan: TahapanProyekData[];
}

export interface UpdateProgressProyekDTO {
  mandorId?: number | null;
  tahapan?: TahapanProyekData[];
}

export const progressProyekService = {
  getMandors: async (): Promise<MandorOption[]> => {
    const response = await api.get("/progress-proyek/mandors");
    return response.data.data;
  },

  getById: async (penjualanId: number): Promise<ProgressProyekData> => {
    const response = await api.get(`/progress-proyek/${penjualanId}`);
    return response.data.data;
  },

  update: async (
    penjualanId: number,
    data: UpdateProgressProyekDTO,
  ): Promise<ProgressProyekData> => {
    const response = await api.patch(`/progress-proyek/${penjualanId}`, data);
    return response.data.data;
  },

  uploadTahapanPhotos: async (
    penjualanId: number,
    namaTahapan: string,
    files: File[],
  ): Promise<ProgressProyekData> => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("foto", file);
    });

    const response = await api.patch(
      `/progress-proyek/${penjualanId}/tahapan/${namaTahapan}/foto`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },
  addTahapanLog: async (
    penjualanId: number,
    data: {
      namaTahapan: string;
      persentase: number;
      deskripsi: string;
      tanggal: string;
      files: File[];
    },
  ): Promise<ProgressProyekData> => {
    const formData = new FormData();
    formData.append("namaTahapan", data.namaTahapan);
    formData.append("persentase", String(data.persentase));
    formData.append("deskripsi", data.deskripsi);
    formData.append("tanggal", data.tanggal);
    data.files.forEach((file) => formData.append("foto", file));

    const response = await api.patch(
      `/progress-proyek/${penjualanId}/tahapan/log`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },
};
