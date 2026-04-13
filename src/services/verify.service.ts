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
  };
  kavling: string;
}

export interface VerifySprData {
  noDokumen: string;
  tanggalTransaksi: string;
  status: string;
  hargaJual: number;
  caraPembayaran: string;
  customer: {
    nama: string;
  };
  kavling: {
    perumahan: string;
    blokUnit: string;
    tipe: string;
  };
}

export interface VerifyDocumentResponse {
  type: "INVOICE" | "SPR";
  data: VerifyInvoiceData | VerifySprData;
}

export const verifyService = {
  verifyDocument: async (id: string): Promise<VerifyDocumentResponse> => {
    const response = await api.get(`/verify/${id}`);
    return response.data.data;
  },
};
