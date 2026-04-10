import api from "../lib/axios";

export interface BankRekeningPt {
  id: number;
  perumahanId: number;
  perumahan?: string;
  namaBank: string;
  noRekening: string;
  atasNama: string;
}

export interface CreateBankRekeningPtDTO {
  perumahanId: number;
  namaBank: string;
  noRekening: string;
  atasNama: string;
}

export const bankRekeningService = {
  getAll: async (): Promise<BankRekeningPt[]> => {
    const response = await api.get("/bank-rekening?limit=100");
    return response.data.data.items;
  },

  create: async (data: CreateBankRekeningPtDTO) => {
    const response = await api.post("/bank-rekening", data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreateBankRekeningPtDTO>) => {
    const response = await api.patch(`/bank-rekening/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/bank-rekening/${id}`);
    return response.data;
  },
};
