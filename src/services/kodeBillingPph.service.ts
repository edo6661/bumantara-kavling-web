import api from "../lib/axios";

export type StatusKodeBillingPph = "MENUNGGU_BAYAR" | "SUDAH_BAYAR";

export interface KodeBillingPphData {
  id: number;
  customerId: number;
  namaCustomer: string;
  penjualanId: number;
  sertifikatUrutan?: number;
  perumahan: string | null;
  blok: string | null;
  nomorUnit: string | null;
  kodeBilling: string;
  fileBilling: string;
  fileSuket: string | null;
  fileBuktiBayar: string | null;
  status: StatusKodeBillingPph;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Normalisasi respons API (termasuk snake_case / URL kosong dari data lama). */
export function normalizeKodeBillingPphData(
  raw: Record<string, unknown> | null | undefined,
): KodeBillingPphData | null {
  if (!raw || typeof raw !== "object") return null;
  const fileBilling = String(
    raw.fileBilling ?? raw.file_billing ?? "",
  ).trim();
  const kodeBilling = String(raw.kodeBilling ?? raw.kode_billing ?? "").trim();
  if (!kodeBilling) return null;
  return {
    ...(raw as unknown as KodeBillingPphData),
    kodeBilling,
    fileBilling,
    penjualanId: Number(raw.penjualanId ?? raw.penjualan_id),
    sertifikatUrutan: Number(raw.sertifikatUrutan ?? raw.sertifikat_urutan ?? 1),
  };
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
  getByPenjualan: async (penjualanId: number): Promise<KodeBillingPphData | null> => {
    const response = await api.get(`/kode-billing-pph/penjualan/${penjualanId}`);
    return normalizeKodeBillingPphData(response.data.data);
  },

  getAllByPenjualan: async (penjualanId: number): Promise<KodeBillingPphData[]> => {
    const response = await api.get(`/kode-billing-pph/penjualan/${penjualanId}/all`);
    const rows = Array.isArray(response.data.data) ? response.data.data : [];
    return rows
      .map((row: Record<string, unknown>) => normalizeKodeBillingPphData(row))
      .filter(Boolean) as KodeBillingPphData[];
  },

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
    sertifikatUrutan?: number;
    file: File;
    pdfPassword?: string;
  }): Promise<KodeBillingPphData> => {
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
    const response = await api.post("/kode-billing-pph/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalizeKodeBillingPphData(response.data.data)!;
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
