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
  penjualanId: number | null;
  kavlingId: number | null;
  mandorId: number | null;
  mandor: MandorOption | null;
  persentase: number;
  createdAt: string;
  updatedAt: string;
  tahapan: TahapanProyekData[];
}

export interface ProgressProyekListItem {
  kavlingId: number;
  penjualanId: number | null;
  penjualanNoTransaksi: string | null;
  blok: string;
  nomorUnit: string;
  nama: string;
  status: string;
  progressProyek: {
    persentase: number;
    mandorId: number | null;
    mandor: MandorOption | null;
  } | null;
}

export interface ProgressProyekListResponse {
  items: ProgressProyekListItem[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface UpdateProgressProyekDTO {
  tahapan?: TahapanProyekData[];
}

export const progressProyekService = {
  getProyekList: async (
    params?: Record<string, unknown>,
  ): Promise<ProgressProyekListResponse> => {
    const response = await api.get("/progress-proyek/proyek", { params });
    return response.data.data;
  },

  getMandors: async (): Promise<MandorOption[]> => {
    const response = await api.get("/progress-proyek/mandors");
    return response.data.data;
  },

  getById: async (penjualanId: number): Promise<ProgressProyekData> => {
    const response = await api.get(`/progress-proyek/${penjualanId}`);
    return response.data.data;
  },

  getByKavlingId: async (kavlingId: number): Promise<ProgressProyekData> => {
    const response = await api.get(`/progress-proyek/kavling/${kavlingId}`);
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

  addTahapanLogByKavling: async (
    kavlingId: number,
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
      `/progress-proyek/kavling/${kavlingId}/tahapan/log`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },
};
