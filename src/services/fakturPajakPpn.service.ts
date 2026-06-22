import api from "../lib/axios";

export interface FakturPajakPpnData {
  id: number;
  customerId: number;
  namaCustomer: string;
  penjualanId: number;
  sertifikatUrutan?: number;
  perumahan: string | null;
  blok: string | null;
  nomorUnit: string | null;
  fileFaktur: string;
  createdAt: string;
  updatedAt: string;
}

export const fakturPajakPpnService = {
  getByPenjualan: async (
    penjualanId: number,
  ): Promise<FakturPajakPpnData | null> => {
    const response = await api.get(`/faktur-pajak-ppn/penjualan/${penjualanId}`);
    return response.data.data;
  },

  getAllByPenjualan: async (penjualanId: number): Promise<FakturPajakPpnData[]> => {
    const response = await api.get(`/faktur-pajak-ppn/penjualan/${penjualanId}/all`);
    return Array.isArray(response.data.data) ? response.data.data : [];
  },

  upload: async (params: {
    customerId: number;
    penjualanId: number;
    sertifikatUrutan?: number;
    file: File;
    pdfPassword?: string;
  }): Promise<FakturPajakPpnData> => {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("customerId", String(params.customerId));
    formData.append("penjualanId", String(params.penjualanId));
    if (params.sertifikatUrutan != null) {
      formData.append("sertifikatUrutan", String(params.sertifikatUrutan));
    }
    if (params.pdfPassword) {
      formData.append("pdfPassword", params.pdfPassword);
    }
    const response = await api.post("/faktur-pajak-ppn/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  delete: async (params: {
    penjualanId: number;
    sertifikatUrutan?: number;
  }): Promise<void> => {
    const query =
      params.sertifikatUrutan != null
        ? `?sertifikatUrutan=${params.sertifikatUrutan}`
        : "";
    await api.delete(`/faktur-pajak-ppn/penjualan/${params.penjualanId}${query}`);
  },
};
