import api from "../lib/axios";
export type CustomerDocType = "fileKtp" | "fileKk" | "fileNpwp" | "lainnya";
export interface CustomerData {
  id: number;
  nikKtp: string;
  nama: string;
  noHp: string;
  email: string | null;
  pekerjaan: string | null;
  perusahaan: string | null;
  bank: string | null;
  alamatKtp: string;
  alamatTinggal: string | null;
  alamatKoresponden: string | null;
  fileKtp: string | null;
  fileKk: string | null;
  fileNpwp: string | null;
  hasAccount: boolean;

  dokumenLainnya?: { id: string; nama: string; fileUrl: string }[];
}

export interface CreateCustomerDTO {
  nikKtp: string;
  nama: string;
  noHp: string;
  email?: string;
  pekerjaan?: string;
  perusahaan?: string;
  bank?: string;
  alamatKtp: string;
  alamatTinggal?: string;
  alamatKoresponden?: string;
}

export const customerService = {
  getAll: async (): Promise<CustomerData[]> => {
    const response = await api.get("/customers?limit=300");
    return response.data.data.items;
  },

  create: async (data: CreateCustomerDTO) => {
    const response = await api.post("/customers", data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreateCustomerDTO>) => {
    const response = await api.patch(`/customers/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  uploadDoc: async (
    id: number,
    docType: CustomerDocType,
    file: File,
    namaDokumen?: string,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    if (namaDokumen) formData.append("namaDokumen", namaDokumen);

    const response = await api.patch(
      `/customers/${id}/upload/${docType}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  },
};
