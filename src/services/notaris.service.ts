import api from "../lib/axios";

export interface PicNotarisData {
  id?: number;
  nama: string;
  noHp: string;
  alamat?: string;
}

export interface AjbDitanganiData {
  id: string;
  customer: string;
  kavling: string;
  biayaAjbTransaksi?: number; // Tambahkan properti ini
}

export interface NotarisData {
  id: number;
  nama: string;
  biayaAjb: number; // Tetap ada karena backend masih memerlukannya walau nilainya 0
  pics: PicNotarisData[];
  ajbDitangani?: AjbDitanganiData[]; // Array dari relasi DetailKavlingPajak
}

export interface CreateNotarisDTO {
  nama: string;
  biayaAjb: number;
  pics?: PicNotarisData[];
}

export const notarisService = {
  getAll: async (): Promise<NotarisData[]> => {
    const response = await api.get("/notaris?limit=100");
    return response.data.data.items;
  },

  create: async (data: CreateNotarisDTO) => {
    const response = await api.post("/notaris", data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreateNotarisDTO>) => {
    const response = await api.patch(`/notaris/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/notaris/${id}`);
    return response.data;
  },
};
