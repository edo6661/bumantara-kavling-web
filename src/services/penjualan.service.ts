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
  hargaDasar: number;
  plafonAwal?: number;
  biayaKpr?: number;
  plafonKredit?: number;
  dpTidakDibayar?: number;
  hargaJual: number;
  hargaPromosi?: number;
  diskonPenjualan?: number;
  dp?: number;
  bookingFee?: number;
  caraPembayaran: string;
  bank?: string;
  nilaiPengajuanKpr?: number;
  agent: string;
  rekeningTujuanId?: number;
  keteranganUpdateSpr?: string;
}

export const penjualanService = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await api.get("/penjualan", {
      params: { ...params },
    });

    return response.data.data;
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
  uploadSignature: async (data: {
    noTransaksi: string;
    signatureBase64: string;
    nama: string;
    peran: string;
    tanggal: string;
  }) => {
    const response = await api.post(
      `/penjualan/${data.noTransaksi}/signature`,
      data,
    );
    return response.data.data;
  },
  update: async (noTransaksi: string, data: Partial<CreatePenjualanDTO>) => {
    const response = await api.patch(`/penjualan/${noTransaksi}`, data);
    return response.data.data;
  },
  gantiKavling: async (
    noTransaksi: string,
    data: { kavlingBaruId: number; alasan: string },
  ) => {
    const response = await api.patch(
      `/penjualan/${noTransaksi}/ganti-kavling`,
      data,
    );
    return response.data.data;
  },
  getPengajuanBatal: async (status?: string) => {
    const response = await api.get("/penjualan/pengajuan-batal", {
      params: { status },
    });
    return response.data.data;
  },
  getPengajuanGantiKavling: async (status?: string) => {
    const response = await api.get("/penjualan/pengajuan-ganti-kavling", {
      params: { status },
    });
    return response.data.data;
  },
  approveBatal: async (id: number, isApproved: boolean) => {
    const response = await api.post(
      `/penjualan/pengajuan-batal/${id}/approve`,
      { isApproved },
    );
    return response.data.data;
  },
  approveGantiKavling: async (id: number, isApproved: boolean) => {
    const response = await api.post(
      `/penjualan/pengajuan-ganti-kavling/${id}/approve`,
      { isApproved },
    );
    return response.data.data;
  },
  regenerateSpr: async (noTransaksi: string) => {
    const response = await api.post(`/penjualan/${noTransaksi}/generate-spr`);
    return response.data.data;
  },
};
