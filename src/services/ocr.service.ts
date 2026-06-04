import api from '../lib/axios';

export interface KasbonBonOcrItem {
  keterangan: string;
  nominal: number;
}

export interface KasbonBonOcrResult {
  namaSupplier: string | null;
  tanggal: string | null;
  items: KasbonBonOcrItem[];
}

export const ocrService = {
  extractKasbonBon: async (file: File): Promise<KasbonBonOcrResult> => {
    const formData = new FormData();
    formData.append('foto_bon', file);
    const response = await api.post('/ocr/extract-kasbon-bon', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as KasbonBonOcrResult;
  },
};
