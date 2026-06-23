export interface PicAgentData {
  id?: number;
  nama: string;
  noHp: string;
  alamat?: string;
}

export interface PenjualanAgentData {
  id: number;
  noTransaksi: string;
  tanggal: string;
  hargaJual: number;
  status: string;
  customer?: { nama: string };
  kavling?: {
    blok: string;
    nomorUnit: string;
    perumahan?: { nama: string };
  };
}

export interface AgentData {
  id: number;
  nik: string;
  kodeSales: string | null;

  nama: string;
  alamat: string | null;
  noHp: string;
  email: string | null;
  status: string;
  type: string;
  ttdData?: string;
  perusahaanAgentId?: number | null;
  perusahaanAgent?: {
    id: number;
    nama: string;
    npwp?: string | null;
    namaBank?: string | null;
    noRekening?: string | null;
    atasNamaRekening?: string | null;
    feeMarketingPct?: number | null;
    feeClosingNominal?: number | null;
    potonganPph?: number | null;
    isPkp?: boolean;
    akte?: string | null;
  };
  namaBank: string | null;
  noRekening: string | null;
  atasNamaRekening: string | null;
  feeMarketingPct: number | null;
  feeClosingNominal: number | null;
  potonganPph: number | null;
  isPkp?: boolean;
  isInHouse?: boolean;
  fileKtp: string | null;
  fileNpwp: string | null;
  kwitansiBookingFee: string | null;
  fileSuratPernyataan: string | null;
  defaultSuratPernyataan: string | null;
  fileSuratKeterangan: string | null;
  fileKtpDirektur: string | null;
  fileNpwpPerusahaan: string | null;
  hasAccount: boolean;
  pics: PicAgentData[];
  penjualan?: PenjualanAgentData[];
}

export interface CreateAgentDTO {
  nik: string;
  nama: string;
  alamat?: string;
  noHp: string;
  email?: string;
  status?: string;
  type?: string;
  perusahaanAgentId?: number | null;
  namaBank: string | null;
  noRekening: string | null;
  atasNamaRekening: string | null;
  feeMarketingPct?: number;
  feeClosingNominal?: number;
  potonganPph?: number;
  isInHouse?: boolean;
  pics?: PicAgentData[];
}
