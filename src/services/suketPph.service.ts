import api from "../lib/axios";

export interface SuketPphData {
  id: number;
  customerId: number;
  namaCustomer: string;
  penjualanId: number;
  perumahan: string | null;
  blok: string | null;
  nomorUnit: string | null;
  fileSuket: string;
  createdAt: string;
  updatedAt: string;
}

export const suketPphService = {
  getByPenjualan: async (penjualanId: number): Promise<SuketPphData | null> => {
    const response = await api.get(`/suket-pph/penjualan/${penjualanId}`);
    return response.data.data;
  },

  upload: async (params: {
    customerId: number;
    penjualanId: number;
    file: File;
    pdfPassword?: string;
  }): Promise<SuketPphData> => {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("customerId", String(params.customerId));
    formData.append("penjualanId", String(params.penjualanId));
    if (params.pdfPassword) {
      formData.append("pdfPassword", params.pdfPassword);
    }
    const response = await api.post("/suket-pph/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },
};
