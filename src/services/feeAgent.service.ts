import api from "../lib/axios";

export interface FeeAgentData {
  id: number;
  agentId: number;
  namaAgent: string;
  penjualanId: number;
  noTransaksi: string;
  namaCustomer: string;
  kavling: string;
  bookingNominal: number | null;
  bookingTanggal: string | null;
  bookingBukti: string | null;
  closingNominal: number | null;
  closingTanggal: string | null;
  closingBukti: string | null;
  marketingNominal: number | null;
  marketingTanggal: string | null;
  marketingBukti: string | null;
}

export interface UpdateFeeAgentDTO {
  bookingNominal?: number;
  bookingTanggal?: string;
  closingNominal?: number;
  closingTanggal?: string;
  marketingNominal?: number;
  marketingTanggal?: string;
}

export const feeAgentService = {
  getAll: async (params?: Record<string, unknown>): Promise<FeeAgentData[]> => {
    const limit = 500;
    const all: FeeAgentData[] = [];
    let cursor: number | undefined;

    for (;;) {
      const response = await api.get("/fee-agents", {
        params: { limit, ...(cursor != null ? { cursor } : {}), ...params },
      });
      const { items, meta } = response.data.data as {
        items: FeeAgentData[];
        meta: { nextCursor: number | null; hasNextPage: boolean };
      };
      all.push(...items);
      if (!meta.hasNextPage || meta.nextCursor == null) break;
      cursor = meta.nextCursor;
    }

    return all;
  },

  update: async (id: number, data: UpdateFeeAgentDTO) => {
    const response = await api.patch(`/fee-agents/${id}`, data);
    return response.data.data;
  },

  uploadBukti: async (
    id: number,
    type: "bookingBukti" | "closingBukti" | "marketingBukti",
    file: File,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.patch(
      `/fee-agents/${id}/upload/${type}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },
};
