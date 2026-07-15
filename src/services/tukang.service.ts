import api from '../lib/axios';

export interface TukangData {
  id: number;
  nik: string;
  nama: string;
  fileKtp: string | null;
  sudahMenikah: boolean | null;
  jumlahAnak: number | null;
  mandorId: number | null;
  mandorUsername?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertTukangBody {
  nik: string;
  nama: string;
  /** NIK lama saat edit — agar koreksi NIK update baris yang sama, bukan create. */
  originalNik?: string;
  sudahMenikah: boolean;
  jumlahAnak: number;
}

export const tukangService = {
  getList: async (search?: string): Promise<TukangData[]> => {
    const response = await api.get('/tukang', {
      params: search ? { search } : undefined,
    });
    return response.data.data;
  },

  upsert: async (body: UpsertTukangBody): Promise<TukangData> => {
    const response = await api.post('/tukang', body);
    return response.data.data;
  },

  uploadKtp: async (nik: string, file: File): Promise<TukangData> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(
      `/tukang/${encodeURIComponent(nik)}/upload-ktp`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data.data;
  },
};
