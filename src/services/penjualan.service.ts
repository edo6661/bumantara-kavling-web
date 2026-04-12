import api from "../lib/axios";

export interface CreatePenjualanDTO {
  noIdentitas: string;
  nama: string;
  noTelepon: string;
  alamat: string;
  perusahaan?: string;
  alamatKoresponden?: string;
  perumahan: string;
  blok: string;
  nomorUnit: string;
  tipe: string;
  luasBangunan: number;
  luasTanah: number;
  tanggal: string;
  hargaJual: number;
  hargaPromosi?: number;
  diskonPenjualan?: number;
  dp?: number;
  bookingFee?: number;
  caraPembayaran: string;
  bank?: string;
  nilaiPengajuanKpr?: number;
  agent: string;
}

export const penjualanService = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await api.get("/penjualan", {
      params: { limit: 100, ...params },
    });
    return response.data.data.items;
  },

  create: async (data: CreatePenjualanDTO) => {
    const response = await api.post("/penjualan", data);
    return response.data.data;
  },
  cancel: async (noTransaksi: string, alasanBatal: string) => {
    const response = await api.patch(`/penjualan/${noTransaksi}/cancel`, {
      alasanBatal,
    });
    return response.data.data;
  },
  uploadBukti: async (
    noTransaksi: string,
    type: "booking" | "dp",
    file: File,
  ) => {
    const formData = new FormData();
    formData.append("fileBukti", file);
    const response = await api.patch(
      `/penjualan/${noTransaksi}/upload/${type}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },
};
