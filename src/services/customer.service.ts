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

  dokumenLainnya?: { id: string; nama: string; fileUrl: string | string[] }[];
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

export interface CustomerPaginatedResponse {
  items: CustomerData[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const customerService = {
  getPaginated: async (
    params?: Record<string, unknown>,
  ): Promise<CustomerPaginatedResponse> => {
    const response = await api.get("/customers", { params });
    return response.data.data;
  },

  /** Semua customer untuk dropdown/lookup (tanpa pagination UI). */
  getAll: async (): Promise<CustomerData[]> => {
    const response = await customerService.getPaginated({ limit: 300, page: 1 });
    return response.items;
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
    pdfPassword?: string,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    if (namaDokumen) formData.append("namaDokumen", namaDokumen);
    if (pdfPassword) formData.append("pdfPassword", pdfPassword);

    const response = await api.patch(
      `/customers/${id}/upload/${docType}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  },
};
