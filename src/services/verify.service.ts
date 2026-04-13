import api from "../lib/axios";

export interface VerifyInvoiceData {
  noDokumen: string;
  pembayaran: string;
  nominal: number;
  jatuhTempo: string;
  status: string;
  tanggalDibuat: string;
  customer: {
    nama: string;
    noHp: string;
    alamat: string;
  };
  kavling: {
    perumahan: string;
    blok: string;
    nomorUnit: string;
    tipe: string;
  };
  transaksi: {
    caraPembayaran: string;
    bank: string;
    hargaJual: number;
    sisaBelumDibayar: number;
  };
}

export interface VerifySprData {
  noDokumen: string;
  tanggalTransaksi: string;
  status: string;
  hargaJual: number;
  dp: number;
  bookingFee: number;
  caraPembayaran: string;
  bank: string;
  customer: {
    nama: string;
    noHp: string;
    alamat: string;
  };
  kavling: {
    perumahan: string;
    blokUnit: string;
    tipe: string;
  };
}

export interface VerifyDocumentResponse {
  type: "INVOICE" | "KWITANSI" | "SPR";
  data: VerifyInvoiceData | VerifySprData;
}

export const verifyService = {
  verifyDocument: async (id: string): Promise<VerifyDocumentResponse> => {
    const response = await api.get(`/verify/${id}`);
    return response.data.data;
  },
};
