import api from '../lib/axios';

export interface TukangData {
  id: number;
  nik: string;
  nama: string;
  mandorId: number | null;
  mandorUsername?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const tukangService = {
  getList: async (search?: string): Promise<TukangData[]> => {
    const response = await api.get('/tukang', {
      params: search ? { search } : undefined,
    });
    return response.data.data;
  },

  upsert: async (body: { nik: string; nama: string }): Promise<TukangData> => {
    const response = await api.post('/tukang', body);
    return response.data.data;
  },
};
