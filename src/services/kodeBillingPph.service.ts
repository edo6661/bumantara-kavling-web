import api from "../lib/axios";

export type StatusKodeBillingPph = "MENUNGGU_BAYAR" | "SUDAH_BAYAR";

export interface KodeBillingPphData {
  id: number;
  customerId: number;
  namaCustomer: string;
  penjualanId: number;
  perumahan: string | null;
  blok: string | null;
  nomorUnit: string | null;
  kodeBilling: string;
  fileBilling: string;
  fileBuktiBayar: string | null;
  status: StatusKodeBillingPph;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KodeBillingPphResponse {
  items: KodeBillingPphData[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const kodeBillingPphService = {
  getAll: async (
    params?: Record<string, unknown>,
  ): Promise<KodeBillingPphResponse> => {
    const response = await api.get("/kode-billing-pph", {
      params: { limit: 10, page: 1, ...params },
    });
    return response.data.data;
  },

  uploadBilling: async (params: {
    customerId: number;
    penjualanId: number;
    file: File;
    pdfPassword?: string;
  }): Promise<KodeBillingPphData> => {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("customerId", String(params.customerId));
    formData.append("penjualanId", String(params.penjualanId));
    if (params.pdfPassword) {
      formData.append("pdfPassword", params.pdfPassword);
    }
    const response = await api.post("/kode-billing-pph/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  uploadBuktiBayar: async (id: number, file: File): Promise<KodeBillingPphData> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.patch(`/kode-billing-pph/${id}/upload-bukti`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },
};
