import api from "../lib/axios";

export interface ProgressPenjualanData {
  id: number;
  penjualanId: number;
  berkasCustomerValid: boolean;
  fileSp3k: string | null;
  fileSalinanAjb: string | null;
  filePpjb: string | null;
  nilaiAjb: number | null;
  biayaBphtb: number | null;
  biayaPph: number | null;
  fileAjb: string | null;
  fileBast: string | null;
  checklistBast: Record<string, string | number | boolean | null> | null;
}

export interface UpdateProgressPenjualanDTO {
  berkasCustomerValid?: boolean;
  nilaiAjb?: number;
  checklistBast?: Record<string, string | number | boolean | null> | null;
}

export const progressPenjualanService = {
  getById: async (penjualanId: number): Promise<ProgressPenjualanData> => {
    const response = await api.get(`/progress-penjualan/${penjualanId}`);
    return response.data.data;
  },

  update: async (
    penjualanId: number,
    data: UpdateProgressPenjualanDTO,
  ): Promise<ProgressPenjualanData> => {
    const response = await api.patch(
      `/progress-penjualan/${penjualanId}`,
      data,
    );
    return response.data.data;
  },

  uploadDocument: async (
    penjualanId: number,
    docType:
      | "fileSp3k"
      | "fileSalinanAjb"
      | "filePpjb"
      | "fileAjb"
      | "fileBast",
    file: File,
  ): Promise<ProgressPenjualanData> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.patch(
      `/progress-penjualan/${penjualanId}/upload/${docType}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },
};
